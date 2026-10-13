"""Reproducible EmbeddingGemma candidate-classifier vs current MiniLM benchmark.

Train only on v3-targeted/train; choose regularization and rejection thresholds
only on validation. Save selection before evaluating the already-exposed v3 test.
Both systems return source spans and use identical exact-match scoring.
"""

import argparse
import hashlib
import json
import platform
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from benchmarkModel import processMemory
from candidateClassifier import (
    FORMAT_VERSION,
    MODEL,
    REVISION,
    CandidateEncoder,
    candidateRows,
    rankCandidates,
)
from decodeSpans import Prediction, acceptedCode, decode
from sklearn.linear_model import LogisticRegression
from smsData import ROOT, Example, normalizeMessage, readSplit
from smsModel import calibrate, groupedMetrics, metrics, writePredictions
from threadpoolctl import threadpool_limits
from tokenizers import Tokenizer

OUT = ROOT / "artifacts/embeddinggemma2-benchmark"
DATA = ROOT / "data/generated/v3-targeted"
BASELINE = ROOT / "artifacts/minilm-v3g"
REPORT = ROOT / "reports/embeddinggemma2"


def save(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def digest(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def sourceHashes() -> dict[str, str]:
    return {
        name: digest(ROOT / name)
        for name in (
            "candidateClassifier.py",
            "compareSmsModels.py",
            "decodeSpans.py",
            "smsModel.py",
            "smsData.py",
        )
    }


def dataset(split: str) -> list[Example]:
    manifest = json.loads((DATA / "manifest.json").read_text())
    if digest(DATA / f"{split}.jsonl") != manifest[split]["sha256"]:
        raise ValueError(f"Dataset changed: {split}")
    return readSplit(split, DATA)


def features(
    encoder: CandidateEncoder, split: str, examples: list[Example]
) -> tuple[list[dict], np.ndarray]:
    rows, texts = candidateRows(examples)
    spec = {
        "model": MODEL,
        "revision": REVISION,
        "source": digest(ROOT / "candidateClassifier.py"),
        "data": digest(DATA / f"{split}.jsonl"),
        "format": FORMAT_VERSION,
        "batchSize": encoder.batchSize,
        "dtype": "bfloat16" if encoder.model.device.type == "cuda" else "float32",
        "rows": len(rows),
    }
    cache = OUT / "features" / f"{split}-batch{encoder.batchSize}"
    cache.mkdir(parents=True, exist_ok=True)
    metadata = cache / "spec.json"
    if metadata.exists() and json.loads(metadata.read_text()) != spec:
        raise ValueError("Stale embedding cache; use a fresh output directory")
    save(metadata, spec)
    chunks = []
    started = time.monotonic()
    for start in range(0, len(texts), 2048):
        path = cache / f"{start:08d}.npy"
        if not path.exists():
            vectors = encoder.encode(texts[start : start + 2048])
            temporary = path.with_suffix(".tmp")
            with temporary.open("wb") as stream:
                np.save(stream, vectors)
            temporary.replace(path)
        chunk = np.load(path)
        if chunk.shape != (min(2048, len(texts) - start), 768):
            raise ValueError(f"Invalid feature chunk: {path}")
        chunks.append(chunk)
        print(
            json.dumps(
                {
                    "split": split,
                    "embedded": min(start + 2048, len(texts)),
                    "of": len(texts),
                    "seconds": round(time.monotonic() - started, 1),
                }
            ),
            flush=True,
        )
    return rows, np.concatenate(chunks)


def summary(
    examples: list[Example], predictions: list[Prediction], decoder: dict
) -> dict:
    threshold, margin = decoder["nullThreshold"], decoder["minimumMargin"]
    return {
        "metrics": metrics(examples, predictions, threshold, margin),
        "byLanguage": groupedMetrics(
            examples, predictions, threshold, "language", margin
        ),
        "byKind": groupedMetrics(examples, predictions, threshold, "kind", margin),
    }


def candidateCoverage(rows: list[dict], examples: list[Example]) -> dict:
    covered = {
        row["message"]
        for row in rows
        if row["code"] == examples[row["message"]]["code"]
    }
    positive = sum(item["code"] is not None for item in examples)
    counts = np.bincount([row["message"] for row in rows], minlength=len(examples))
    return {
        "positiveMessages": positive,
        "coveredPositiveMessages": len(covered),
        "recallCeiling": len(covered) / positive,
        "totalCandidates": len(rows),
        "meanCandidatesPerSms": float(np.mean(counts)),
        "p95CandidatesPerSms": float(np.percentile(counts, 95)),
    }


def train(device: str, batchSize: int) -> None:
    if (OUT / "selection.json").exists():
        raise ValueError("Selection is frozen; use a new experiment directory")
    encoder = CandidateEncoder(device, batchSize)
    training, validation = dataset("train"), dataset("validation")
    trainRows, trainVectors = features(encoder, "train", training)
    validationRows, validationVectors = features(encoder, "validation", validation)
    labels = np.array([row["label"] for row in trainRows], dtype=np.int64)
    attempts = []
    best = None
    # A fixed, small regularization grid; validation maximizes exact-code recall
    # subject to the same 99.5% precision requirement as the existing MiniLM.
    for regularization in (0.1, 1.0, 10.0, 100.0):
        started = time.monotonic()
        classifier = LogisticRegression(
            C=regularization, max_iter=1000, solver="lbfgs", random_state=20261007
        )
        with threadpool_limits(limits=4):
            classifier.fit(trainVectors, labels)
        if int(classifier.n_iter_.max()) >= classifier.max_iter:
            raise ValueError("Classifier did not converge")
        predictions = rankCandidates(
            validationRows,
            classifier.decision_function(validationVectors),
            len(validation),
        )
        threshold, calibrated = calibrate(
            validation, predictions, targetPrecision=0.995
        )
        attempt = {
            "C": regularization,
            "nullThreshold": threshold,
            "minimumMargin": calibrated["minimumMargin"],
            "validation": calibrated,
            "fitSeconds": time.monotonic() - started,
        }
        attempts.append(attempt)
        print(json.dumps(attempt), flush=True)
        if best is None or calibrated["recall"] > best["validation"]["recall"]:
            best = attempt
            save(
                OUT / "classifier.json",
                {
                    "weights": classifier.coef_[0].tolist(),
                    "bias": float(classifier.intercept_[0]),
                },
            )
            save(OUT / "decoder.json", attempt)
    save(
        OUT / "training.json",
        {
            "attempts": attempts,
            "trainingCoverage": candidateCoverage(trainRows, training),
            "validationCoverage": candidateCoverage(validationRows, validation),
            "trainingPositiveCandidates": int(labels.sum()),
            "trainMessages": len(training),
            "validationMessages": len(validation),
        },
    )
    selection = {
        "selectedAtUtc": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "revision": REVISION,
        "encoderFrozen": True,
        "embeddingBatchSize": batchSize,
        "encoderParameters": sum(
            parameter.numel() for parameter in encoder.model.parameters()
        ),
        "policy": "Highest validation recall at >=99.5% exact-code precision; C grid [0.1, 1, 10, 100]; existing margin grid.",
        "classifierSha256": digest(OUT / "classifier.json"),
        "decoderSha256": digest(OUT / "decoder.json"),
        "sources": sourceHashes(),
        "data": {
            split: digest(DATA / f"{split}.jsonl")
            for split in ("train", "validation", "test")
        },
        "selection": best,
        "limitations": [
            "Synthetic assistant-translated corpus, not customer SMS.",
            "The v3 test is already exposed through the earlier MiniLM experiment and discussion. This is a comparative replay, not a new untouched test.",
            "No v3 test labels or predictions are used to fit this classifier or select its hyperparameters/threshold.",
        ],
    }
    save(OUT / "selection.json", selection)
    save(REPORT / "selection.json", selection)
    save(REPORT / "training.json", json.loads((OUT / "training.json").read_text()))


def verifySelection() -> dict:
    selected = json.loads((OUT / "selection.json").read_text())
    if selected["sources"] != sourceHashes():
        raise ValueError("Inference or evaluation source changed after selection")
    if (
        digest(OUT / "classifier.json") != selected["classifierSha256"]
        or digest(OUT / "decoder.json") != selected["decoderSha256"]
    ):
        raise ValueError("Selected classifier/decoder changed")
    for split, expected in selected["data"].items():
        if digest(DATA / f"{split}.jsonl") != expected:
            raise ValueError(f"Selected dataset changed: {split}")
    return selected


class MiniLmRuntime:
    def __init__(self):
        options = ort.SessionOptions()
        options.intra_op_num_threads = 4
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(
            str(BASELINE / "onnx/model.int8.onnx"),
            sess_options=options,
            providers=["CPUExecutionProvider"],
        )
        self.tokenizer = Tokenizer.from_file(str(BASELINE / "onnx/tokenizer.json"))
        self.decoder = json.loads((BASELINE / "onnx/decoder.json").read_text())
        self.tokenizer.enable_truncation(
            max_length=self.decoder["maxTokens"], stride=64
        )

    def predict(self, text: str) -> Prediction:
        text = normalizeMessage(text)
        encoded = self.tokenizer.encode(text)
        if encoded.overflowing:
            raise ValueError("Benchmark SMS exceeds MiniLM's context")
        output = self.session.run(
            None,
            {
                "input_ids": np.array([encoded.ids], dtype=np.int64),
                "attention_mask": np.array([encoded.attention_mask], dtype=np.int64),
            },
        )
        return decode(
            text,
            encoded.offsets,
            output[0][0],
            output[1][0],
            presenceScore=float(output[2][0]),
            tokenScores=output[3][0],
        )


def evaluate(name: str, device: str, batchSize: int) -> None:
    if name == "gemma":
        verifySelection()
    examples = dataset("test")
    started = time.monotonic()
    coverage = None
    if name == "gemma":
        encoder = CandidateEncoder(device, batchSize)
        rows, vectors = features(encoder, "test", examples)
        classifier = json.loads((OUT / "classifier.json").read_text())
        predictions = rankCandidates(
            rows,
            vectors @ np.array(classifier["weights"]) + classifier["bias"],
            len(examples),
        )
        decoder = json.loads((OUT / "decoder.json").read_text())
        coverage = candidateCoverage(rows, examples)
    else:
        runtime = MiniLmRuntime()
        decoder = runtime.decoder
        predictions = []
        for index, example in enumerate(examples):
            predictions.append(runtime.predict(example["text"]))
            if (index + 1) % 2000 == 0:
                print(
                    json.dumps(
                        {"model": name, "processed": index + 1, "of": len(examples)}
                    ),
                    flush=True,
                )
    result = {
        "model": name,
        "dataSha256": digest(DATA / "test.jsonl"),
        "elapsedSeconds": time.monotonic() - started,
        "decoder": decoder,
        "candidateCoverage": coverage,
        **summary(examples, predictions, decoder),
    }
    if name == "minilm":
        result["modelSha256"] = digest(BASELINE / "onnx/model.int8.onnx")
    save(REPORT / f"{name}.test.json", result)
    writePredictions(
        OUT / f"{name}.test.predictions.jsonl",
        examples,
        predictions,
        decoder["nullThreshold"],
        decoder["minimumMargin"],
    )
    print(json.dumps(result["metrics"], indent=2), flush=True)


def runtimeBenchmark(name: str, device: str) -> None:
    """Warm end-to-end single-SMS latency; same 300 validation inputs per model."""
    examples = dataset("validation")
    selected, counts = [], {}
    for example in examples:
        language = example["language"]
        if counts.get(language, 0) < 10:
            selected.append(example)
            counts[language] = counts.get(language, 0) + 1
    started = time.monotonic()
    if name == "gemma":
        verifySelection()
        encoder = CandidateEncoder(device)
        classifier = json.loads((OUT / "classifier.json").read_text())
        weights, bias = np.array(classifier["weights"]), classifier["bias"]
        decoder = json.loads((OUT / "decoder.json").read_text())

        def predict(text: str) -> Prediction:
            return encoder.predict(text, weights, bias)

    else:
        runtime = MiniLmRuntime()
        decoder = runtime.decoder
        predict = runtime.predict
    loadSeconds = time.monotonic() - started
    for example in selected[:10]:
        predict(example["text"])
    latencies, predictions = [], []
    for index, example in enumerate(selected):
        started = time.monotonic()
        prediction = predict(example["text"])
        predictions.append(
            acceptedCode(prediction, decoder["nullThreshold"], decoder["minimumMargin"])
        )
        latencies.append((time.monotonic() - started) * 1000)
        if (index + 1) % 50 == 0:
            print(
                json.dumps(
                    {
                        "runtime": name,
                        "device": device,
                        "processed": index + 1,
                        "of": len(selected),
                    }
                ),
                flush=True,
            )
    result = {
        "model": name,
        "device": device,
        "platform": platform.platform(),
        "cpuThreads": 4,
        "androidMeasured": False,
        "messages": len(selected),
        "sampleIds": [item["id"] for item in selected],
        "sampleSha256": hashlib.sha256(
            json.dumps([item["id"] for item in selected]).encode()
        ).hexdigest(),
        "loadSeconds": loadSeconds,
        "p50EndToEndMs": float(np.percentile(latencies, 50)),
        "p95EndToEndMs": float(np.percentile(latencies, 95)),
        "meanEndToEndMs": float(np.mean(latencies)),
        "processMemoryBytes": processMemory(),
        "predictions": predictions,
        "notes": [
            "Fresh process, 10 warmups, one SMS per call; Gemma batches candidates within that SMS.",
            "Includes normalization/candidate enumeration, tokenization, model inference, classification and rejection.",
            "Gemma CPU uses FP32, GPU uses BF16; MiniLM uses the selected compact ONNX model on CPU.",
            "Common Python benchmark harness imports PyTorch/SentenceTransformers for both; RSS is not an optimized Android footprint.",
        ],
    }
    if device == "cuda":
        result["gpu"] = torch.cuda.get_device_name(0)
        result["peakGpuAllocatedBytes"] = torch.cuda.max_memory_allocated()
    save(REPORT / f"{name}.runtime.{device}.json", result)
    print(
        json.dumps(
            {
                key: value
                for key, value in result.items()
                if key not in ("sampleIds", "predictions")
            },
            indent=2,
        ),
        flush=True,
    )


def main() -> None:
    global OUT, REPORT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=("train", "evaluate", "runtime"))
    parser.add_argument("--model", choices=("gemma", "minilm"), default="gemma")
    parser.add_argument("--device", choices=("cpu", "cuda"), default="cuda")
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--output-dir", type=Path, default=OUT)
    parser.add_argument("--report-dir", type=Path, default=REPORT)
    args = parser.parse_args()
    OUT, REPORT = args.output_dir, args.report_dir
    torch.set_num_threads(4)
    torch.set_num_interop_threads(1)
    OUT.mkdir(parents=True, exist_ok=True)
    if args.phase == "train":
        train(args.device, args.batch_size)
    elif args.phase == "evaluate":
        evaluate(args.model, args.device, args.batch_size)
    else:
        runtimeBenchmark(args.model, args.device)


if __name__ == "__main__":
    main()
