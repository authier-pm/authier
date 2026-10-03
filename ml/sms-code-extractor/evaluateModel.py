"""Evaluate the held-out test set in every supported language and code category.

Test scores are never used to calibrate the decoder. An INT8 decoder is calibrated
on validation only, independently of the floating-point checkpoint.
"""

import argparse
import hashlib
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from tokenizers import Tokenizer

from smsData import CONFIG, ROOT, Example, readSplit, readTemplates
from smsModel import (
    Prediction,
    calibrate,
    collate,
    decode,
    encodeExamples,
    groupedMetrics,
    loadModel,
    loadTokenizer,
    metrics,
    predictTorch,
    writePredictions,
)


def predictOnnx(
    modelPath: Path, tokenizer, examples: list[Example], batchSize: int
) -> tuple[list[Prediction], dict]:
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    started = time.monotonic()
    session = ort.InferenceSession(
        str(modelPath), sess_options=options, providers=["CPUExecutionProvider"]
    )
    loadSeconds = time.monotonic() - started
    if batchSize == 1:
        # Match the local CLI: serialized tokenizer, one unpadded message per run.
        # Dynamic INT8 quantization can differ with batch composition and padding.
        runtimeTokenizer = Tokenizer.from_file(str(modelPath.parent / "tokenizer.json"))
        runtimeTokenizer.enable_truncation(max_length=CONFIG["maxTokens"], stride=64)
        features = []
        for example in examples:
            encoded = runtimeTokenizer.encode(example["text"])
            if encoded.overflowing:
                raise ValueError(f"Evaluation SMS exceeds one window: {example['id']}")
            features.append(
                {
                    "input_ids": encoded.ids,
                    "attention_mask": encoded.attention_mask,
                    "offsets": encoded.offsets,
                }
            )
    else:
        features = encodeExamples(examples, tokenizer)
    predictions = []
    batches = []
    for index in range(0, len(features), batchSize):
        chunk = features[index : index + batchSize]
        if batchSize == 1:
            inputs = {
                key: np.array([chunk[0][key]], dtype=np.int64)
                for key in ("input_ids", "attention_mask")
            }
        else:
            batch = collate(chunk, tokenizer)
            inputs = {
                key: value.numpy()
                for key, value in batch.items()
                if key in ("input_ids", "attention_mask")
            }
        started = time.monotonic()
        outputs = session.run(None, inputs)
        starts, ends = outputs[:2]
        presence = outputs[2].tolist() if len(outputs) >= 3 else [None] * len(chunk)
        tokens = outputs[3] if len(outputs) == 4 else [None] * len(chunk)
        batches.append(time.monotonic() - started)
        predictions.extend(
            decode(
                example["text"],
                feature["offsets"],
                left,
                right,
                presenceScore=score,
                tokenScores=tokenValues,
            )
            for example, feature, left, right, score, tokenValues in zip(
                examples[index : index + batchSize],
                chunk,
                starts,
                ends,
                presence,
                tokens,
                strict=True,
            )
        )
        if len(batches) % max(100, 2400 // batchSize) == 0:
            print(
                json.dumps(
                    {
                        "onnxProcessed": min(index + batchSize, len(features)),
                        "of": len(features),
                    }
                ),
                flush=True,
            )
    return predictions, {
        "loadSeconds": loadSeconds,
        "batchSize": batchSize,
        "padding": "none" if batchSize == 1 else "multiple of 8",
        "totalInferenceSeconds": sum(batches),
        "medianBatchMs": float(np.median(batches) * 1000),
        "platform": "Linux x86_64 desktop CPU, 4 threads; NOT a 4 GB Android benchmark",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v2")
    parser.add_argument(
        "--data-dir", type=Path, help="Defaults to the training run's corpus"
    )
    parser.add_argument(
        "--model-name",
        default="model.int8.onnx",
        help="ONNX candidate chosen using validation",
    )
    parser.add_argument(
        "--output-tag",
        help="Separate report name for validation-only quantization comparisons",
    )
    parser.add_argument("--backend", choices=("torch", "onnx"), default="torch")
    parser.add_argument(
        "--comparison",
        action="store_true",
        help="Evaluate a baseline on another corpus; save separate results and decoder",
    )
    parser.add_argument(
        "--batch-size", type=int, help="Default: Torch 24; ONNX 1 (CLI runtime parity)"
    )
    parser.add_argument(
        "--device", default="cuda" if torch.cuda.is_available() else "cpu"
    )
    parser.add_argument("--split", choices=("validation", "test"), default="test")
    args = parser.parse_args()
    batchSize = args.batch_size
    if batchSize is None:
        batchSize = 24 if args.backend == "torch" else 1
    if batchSize < 1:
        raise ValueError("Batch size must be positive")
    torch.set_num_threads(4)
    training = json.loads((args.run / "training.json").read_text())
    dataDirectory = args.data_dir or Path(
        training.get("dataDirectory", ROOT / "data/generated")
    )
    config = training["config"]
    evaluationDataset = training["dataset"]
    outputDirectory = args.run
    if args.comparison:
        if args.data_dir is None:
            raise ValueError("Comparison requires an explicit --data-dir")
        evaluationDataset = json.loads((dataDirectory / "manifest.json").read_text())
        outputDirectory = args.run / "comparisons" / dataDirectory.name
        outputDirectory.mkdir(parents=True, exist_ok=True)
    for split in ("validation", args.split):
        digest = hashlib.sha256(
            (dataDirectory / f"{split}.jsonl").read_bytes()
        ).hexdigest()
        if digest != evaluationDataset[split]["sha256"]:
            raise ValueError(f"Dataset changed since training: {split}")
    decoder = json.loads((args.run / "decoder.json").read_text())
    tokenizer = loadTokenizer(args.run / "checkpoint")
    examples = readSplit(args.split, dataDirectory)
    benchmark = None
    modelFile = args.run / "checkpoint/model.safetensors"
    if args.backend == "onnx":
        modelFile = args.run / "onnx" / args.model_name
    with modelFile.open("rb") as stream:
        modelHash = hashlib.file_digest(stream, "sha256").hexdigest()
    if args.backend == "torch":
        model = loadModel(args.run / "checkpoint").to(args.device)
        predictions = predictTorch(
            model, tokenizer, examples, batchSize, torch.device(args.device)
        )
        if args.split == "validation":
            threshold, validationMetrics = calibrate(
                examples,
                predictions,
                targetPrecision=config["validationTargetPrecision"],
            )
            decoder = {
                **decoder,
                "nullThreshold": threshold,
                "minimumMargin": validationMetrics["minimumMargin"],
                "calibratedOn": "validation",
                "validation": validationMetrics,
            }
            (outputDirectory / "decoder.json").write_text(
                json.dumps(decoder, indent=2) + "\n"
            )
    else:
        modelPath = args.run / "onnx" / args.model_name
        validation = readSplit("validation", dataDirectory)
        validationPredictions, _ = predictOnnx(
            modelPath, tokenizer, validation, batchSize
        )
        threshold, validationMetrics = calibrate(
            validation,
            validationPredictions,
            targetPrecision=config["validationTargetPrecision"],
        )
        decoder = {
            **decoder,
            "nullThreshold": threshold,
            "minimumMargin": validationMetrics["minimumMargin"],
            "calibratedOn": "validation",
            "validation": validationMetrics,
        }
        decoderName = (
            f"decoder.{args.output_tag}.json" if args.output_tag else "decoder.json"
        )
        decoderDirectory = outputDirectory if args.comparison else args.run / "onnx"
        (decoderDirectory / decoderName).write_text(
            json.dumps(decoder, indent=2) + "\n"
        )
        if args.split == "validation":
            predictions = validationPredictions
        else:
            predictions, benchmark = predictOnnx(
                modelPath, tokenizer, examples, batchSize
            )
    threshold = decoder["nullThreshold"]
    minimumMargin = decoder.get("minimumMargin", 0.0)
    byLanguage = groupedMetrics(
        examples, predictions, threshold, "language", minimumMargin
    )
    if set(byLanguage) != set(CONFIG["languages"]):
        raise ValueError("Not all supported languages were evaluated")
    byLanguageAndKind = {}
    for language in CONFIG["languages"]:
        indices = [
            index
            for index, example in enumerate(examples)
            if example["language"] == language
        ]
        byLanguageAndKind[language] = groupedMetrics(
            [examples[index] for index in indices],
            [predictions[index] for index in indices],
            threshold,
            "kind",
            minimumMargin,
        )
        if set(byLanguageAndKind[language]) != set(CONFIG["codeKinds"]) | {"noCode"}:
            raise ValueError(f"Missing code category in {language}")
    result = {
        "backend": args.backend,
        "inferenceBatchSize": batchSize,
        "split": args.split,
        "checkpointEpoch": decoder["epoch"],
        "nullThreshold": threshold,
        "minimumMargin": minimumMargin,
        "provenance": config["provenance"],
        "dataDirectory": str(dataDirectory),
        "dataset": evaluationDataset[args.split],
        "baselineComparison": args.comparison,
        "calibration": "Same new validation corpus, weights unchanged"
        if args.comparison
        else "Validation only",
        "modelName": args.model_name if args.backend == "onnx" else "checkpoint",
        "modelSha256": modelHash,
        "decoderSha256": hashlib.sha256(
            json.dumps(decoder, sort_keys=True).encode()
        ).hexdigest(),
        "overall": metrics(examples, predictions, threshold, minimumMargin),
        "byLanguage": byLanguage,
        "byCodeKind": groupedMetrics(
            examples, predictions, threshold, "kind", minimumMargin
        ),
        "byLanguageAndCodeKind": byLanguageAndKind,
        "byTemplateFamily": groupedMetrics(
            examples, predictions, threshold, "family", minimumMargin
        ),
        "languageNames": {
            code: value["name"] for code, value in readTemplates().items()
        },
        "desktopBenchmark": benchmark,
        "testUsedForSelection": False,
        "targetPrecision": config["validationTargetPrecision"],
        "precisionTargetMet": metrics(examples, predictions, threshold, minimumMargin)[
            "precision"
        ]
        >= config["validationTargetPrecision"],
        "deploymentRecommended": False,
        "limitations": [
            "Synthetic data only; no real-world accuracy claim.",
            "Translations have not been reviewed by native speakers.",
            "Cases sharing a template are correlated; counts are not independent language samples.",
            "Codes support 4–10 ASCII letters/digits after Unicode digit and NFKC normalization.",
            "No Android integration or 4 GB device benchmark yet.",
        ],
    }
    tag = args.output_tag or args.backend
    output = outputDirectory / f"{args.split}.{tag}.json"
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    writePredictions(
        outputDirectory / f"{args.split}.{tag}.predictions.jsonl",
        examples,
        predictions,
        threshold,
        minimumMargin,
    )
    print(
        json.dumps(
            {
                "report": str(output),
                "overall": result["overall"],
                "byCodeKind": result["byCodeKind"],
            },
            indent=2,
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
