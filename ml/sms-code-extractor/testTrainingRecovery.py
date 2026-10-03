"""An interrupted training run must resume to the same weights and optimizer state."""

import hashlib
import json
import sys
from pathlib import Path

import pytest
import torch
from transformers import BertConfig

import trainModel
from decodeSpans import Prediction
from SmsExtractor import SmsExtractor


class TinyTokenizer:
    pad_token_id = 0

    def save_pretrained(self, path):
        pass


def tinyModel(*args, **kwargs):
    return SmsExtractor(
        BertConfig(
            vocab_size=24,
            hidden_size=12,
            num_hidden_layers=1,
            num_attention_heads=3,
            intermediate_size=24,
        )
    )


def tinyCollate(features, tokenizer):
    return {
        key: torch.tensor([row[key] for row in features], dtype=torch.long)
        for key in features[0]
    }


def testResumeMatchesUninterruptedTraining(tmp_path, monkeypatch):
    data = tmp_path / "data"
    data.mkdir()
    rows = [
        {
            "input_ids": [1, 2 + i, 3, 4],
            "attention_mask": [1, 1, 1, 1],
            "start_positions": 2 if i % 2 else 0,
            "end_positions": 2 if i % 2 else 0,
            "code": "ABCDEF" if i % 2 else None,
        }
        for i in range(8)
    ]
    manifest = {}
    for split in ("train", "validation", "test"):
        content = "".join(json.dumps(row) + "\n" for row in rows).encode()
        (data / f"{split}.jsonl").write_bytes(content)
        manifest[split] = {
            "examples": len(rows),
            "sha256": hashlib.sha256(content).hexdigest(),
        }
    (data / "manifest.json").write_text(json.dumps(manifest))
    config = tmp_path / "config.json"
    config.write_text(json.dumps({"presenceHead": True, "epochs": 2, "batchSize": 2}))
    monkeypatch.setattr(trainModel, "loadModel", tinyModel)
    monkeypatch.setattr(trainModel, "loadTokenizer", lambda *args: TinyTokenizer())
    monkeypatch.setattr(trainModel, "collate", tinyCollate)
    monkeypatch.setattr(
        trainModel,
        "encodeExamples",
        lambda examples, tokenizer: [
            {key: value for key, value in row.items() if key != "code"}
            for row in examples
        ],
    )
    monkeypatch.setattr(
        trainModel,
        "predictTorch",
        lambda model, tokenizer, examples, *args: [
            Prediction(row["code"], 1 if row["code"] else -1) for row in examples
        ],
    )

    def run(directory: Path, resume=False):
        args = [
            "trainModel.py",
            "--output",
            str(directory),
            "--data-dir",
            str(data),
            "--config",
            str(config),
            "--device",
            "cpu",
            "--save-every",
            "1",
        ]
        if resume:
            args.append("--resume")
        monkeypatch.setattr(sys, "argv", args)
        trainModel.main()

    complete = tmp_path / "complete"
    interrupted = tmp_path / "interrupted"
    run(complete)
    originalSave = torch.save

    class Interrupted(Exception):
        pass

    def interruptThirdStep(value, destination, *args, **kwargs):
        originalSave(value, destination, *args, **kwargs)
        if value["step"] == 3:
            raise Interrupted()

    monkeypatch.setattr(torch, "save", interruptThirdStep)
    with pytest.raises(Interrupted):
        run(interrupted)
    monkeypatch.setattr(torch, "save", originalSave)
    run(interrupted, resume=True)
    expected = torch.load(complete / "recovery.pt", weights_only=True)
    actual = torch.load(interrupted / "recovery.pt", weights_only=True)
    assert actual["step"] == expected["step"] == 8
    assert actual["epoch"] == expected["epoch"] == 3
    assert actual["scheduler"] == expected["scheduler"]
    for name, value in expected["model"].items():
        torch.testing.assert_close(actual["model"][name], value, rtol=0, atol=0)
    for key, value in expected["optimizer"]["state"].items():
        for name, tensor in value.items():
            torch.testing.assert_close(
                actual["optimizer"]["state"][key][name], tensor, rtol=0, atol=0
            )
