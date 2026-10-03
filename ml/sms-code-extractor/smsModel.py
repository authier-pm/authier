"""Shared tokenization, constrained span decoding, and exact-match evaluation."""

import json
from collections import defaultdict
from dataclasses import asdict
from pathlib import Path

import torch
from transformers import BertConfig, BertForQuestionAnswering, XLMRobertaTokenizerFast

from decodeSpans import Prediction, acceptedCode, decode
from smsData import CONFIG, Example, normalizeMessage
from SmsExtractor import SmsExtractor


def loadTokenizer(source: str | Path = CONFIG["baseModel"]) -> XLMRobertaTokenizerFast:
    kwargs = {}
    if str(source) == CONFIG["baseModel"]:
        kwargs["revision"] = CONFIG["baseRevision"]
    # Transformers 4.57.6 mistakes saved large-vocabulary BERT tokenizers for
    # Mistral. MiniLM uses XLM-R SentencePiece and must retain that tokenizer.
    return XLMRobertaTokenizerFast.from_pretrained(
        str(source), fix_mistral_regex=False, **kwargs
    )


def loadModel(
    source: str | Path = CONFIG["baseModel"],
    presenceHead: bool = False,
    tokenHead: bool = False,
) -> BertForQuestionAnswering | SmsExtractor:
    kwargs = {}
    if str(source) == CONFIG["baseModel"]:
        kwargs["revision"] = CONFIG["baseRevision"]
    config = BertConfig.from_pretrained(str(source), **kwargs)
    if tokenHead:
        config.sms_token_head = True
    if presenceHead or tokenHead or getattr(config, "sms_presence_head", False):
        return SmsExtractor.from_pretrained(
            str(source), config=config, attn_implementation="eager", **kwargs
        )
    return BertForQuestionAnswering.from_pretrained(
        str(source), config=config, attn_implementation="eager", **kwargs
    )


def encodeExamples(
    examples: list[Example], tokenizer: XLMRobertaTokenizerFast
) -> list[dict]:
    encoded = tokenizer(
        [example["text"] for example in examples],
        max_length=CONFIG["maxTokens"],
        truncation=True,
        return_offsets_mapping=True,
        return_special_tokens_mask=True,
    )
    result = []
    for index, example in enumerate(examples):
        offsets = encoded["offset_mapping"][index]
        start = end = 0
        if example["code"] is not None:
            tokens = [
                position
                for position, (left, right) in enumerate(offsets)
                if right > left and right > example["start"] and left < example["end"]
            ]
            if not tokens:
                raise ValueError(f"Answer truncated: {example['id']}")
            start, end = tokens[0], tokens[-1]
            if offsets[start][0] > example["start"] or offsets[end][1] < example["end"]:
                raise ValueError(f"Partial answer: {example['id']}")
        result.append(
            {
                "input_ids": encoded["input_ids"][index],
                "attention_mask": encoded["attention_mask"][index],
                "start_positions": start,
                "end_positions": end,
                "offsets": offsets,
            }
        )
    return result


def collate(
    features: list[dict], tokenizer: XLMRobertaTokenizerFast
) -> dict[str, torch.Tensor]:
    batch = tokenizer.pad(
        [
            {key: feature[key] for key in ("input_ids", "attention_mask")}
            for feature in features
        ],
        padding=True,
        pad_to_multiple_of=8,
        return_tensors="pt",
    )
    for label in ("start_positions", "end_positions"):
        batch[label] = torch.tensor(
            [feature[label] for feature in features], dtype=torch.long
        )
    return dict(batch)


def predictTorch(
    model: BertForQuestionAnswering | SmsExtractor,
    tokenizer: XLMRobertaTokenizerFast,
    examples: list[Example],
    batchSize: int,
    device: torch.device,
) -> list[Prediction]:
    features = encodeExamples(examples, tokenizer)
    model.eval()
    predictions = []
    with torch.inference_mode():
        for index in range(0, len(features), batchSize):
            chunk = features[index : index + batchSize]
            batch = collate(chunk, tokenizer)
            output = model(
                **{
                    key: value.to(device)
                    for key, value in batch.items()
                    if key in ("input_ids", "attention_mask")
                }
            )
            starts = output.start_logits.float().cpu().numpy()
            ends = output.end_logits.float().cpu().numpy()
            presence = getattr(output, "presence_logits", None)
            tokenOutput = getattr(output, "code_token_logits", None)
            tokenScores = [None] * len(chunk)
            if tokenOutput is not None:
                tokenScores = tokenOutput.float().cpu().numpy()
            scores = [None] * len(chunk)
            if presence is not None:
                scores = presence.float().cpu().numpy().tolist()
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
                    scores,
                    tokenScores,
                    strict=True,
                )
            )
    return predictions


def metrics(
    examples: list[Example],
    predictions: list[Prediction],
    threshold: float,
    minimumMargin: float = 0.0,
) -> dict:
    positive = returned = correct = exact = falsePositive = 0
    for example, prediction in zip(examples, predictions, strict=True):
        actual = acceptedCode(prediction, threshold, minimumMargin)
        positive += example["code"] is not None
        returned += actual is not None
        correct += actual is not None and actual == example["code"]
        exact += actual == example["code"]
        falsePositive += example["code"] is None and actual is not None
    precision = correct / returned if returned else 0.0
    recall = correct / positive if positive else 0.0
    negatives = len(examples) - positive
    return {
        "examples": len(examples),
        "positives": positive,
        "negatives": negatives,
        "correctCodes": correct,
        "returnedCodes": returned,
        "falsePositives": falsePositive,
        "exactMatch": exact / len(examples) if examples else 0.0,
        "precision": precision,
        "recall": recall,
        "f1": 2 * precision * recall / (precision + recall)
        if precision + recall
        else 0.0,
        "falsePositiveRate": falsePositive / negatives if negatives else 0.0,
    }


def calibrate(
    examples: list[Example],
    predictions: list[Prediction],
    includeMargin: bool = True,
    targetPrecision: float = CONFIG["validationTargetPrecision"],
) -> tuple[float, dict]:
    """Choose threshold using validation only, maximizing recall at target precision."""
    if not 0 < targetPrecision <= 1:
        raise ValueError("Target precision must be in (0, 1]")
    ordered = sorted(
        zip(examples, predictions, strict=True),
        key=lambda pair: pair[1].score,
        reverse=True,
    )
    bestThreshold = 1e6
    bestCorrect = 0
    bestMargin = 0.0
    margins = (0.0, 0.5, 1.0, 2.0, 3.0, 4.0, 6.0, 8.0) if includeMargin else (0.0,)
    for minimumMargin in margins:
        returned = correct = index = 0
        while index < len(ordered):
            score = ordered[index][1].score
            while index < len(ordered) and ordered[index][1].score == score:
                example, prediction = ordered[index]
                if prediction.code is not None and prediction.margin >= minimumMargin:
                    returned += 1
                    correct += prediction.code == example["code"]
                index += 1
            if (
                returned
                and correct / returned >= targetPrecision
                and correct > bestCorrect
            ):
                bestCorrect = correct
                bestThreshold = score - 1e-5
                bestMargin = minimumMargin
    return bestThreshold, {
        **metrics(examples, predictions, bestThreshold, bestMargin),
        "minimumMargin": bestMargin,
    }


def groupedMetrics(
    examples: list[Example],
    predictions: list[Prediction],
    threshold: float,
    key: str,
    minimumMargin: float = 0.0,
) -> dict:
    groups = defaultdict(list)
    for example, prediction in zip(examples, predictions, strict=True):
        groups[example[key]].append((example, prediction))
    return {
        name: metrics(
            [pair[0] for pair in group],
            [pair[1] for pair in group],
            threshold,
            minimumMargin,
        )
        for name, group in sorted(groups.items())
    }


def writePredictions(
    path: Path,
    examples: list[Example],
    predictions: list[Prediction],
    threshold: float,
    minimumMargin: float = 0.0,
) -> None:
    path.write_text(
        "".join(
            json.dumps(
                {
                    **example,
                    "prediction": acceptedCode(prediction, threshold, minimumMargin),
                    "candidate": asdict(prediction),
                },
                ensure_ascii=False,
            )
            + "\n"
            for example, prediction in zip(examples, predictions, strict=True)
        )
    )


def inputExample(text: str) -> Example:
    return {
        "id": "input",
        "language": "unknown",
        "family": "input",
        "kind": "unknown",
        "text": normalizeMessage(text),
        "code": None,
        "start": -1,
        "end": -1,
    }
