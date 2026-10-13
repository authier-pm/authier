"""Combine paired quality and sequential runtime results without tuning models."""

import argparse
import json
from pathlib import Path

from smsData import ROOT

REPORT = ROOT / "reports/embeddinggemma2"
ARTIFACTS = ROOT / "artifacts/embeddinggemma2-benchmark"


def read(path: Path) -> dict:
    return json.loads(path.read_text())


def main() -> None:
    global REPORT, ARTIFACTS
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=ARTIFACTS)
    parser.add_argument("--report-dir", type=Path, default=REPORT)
    args = parser.parse_args()
    ARTIFACTS, REPORT = args.output_dir, args.report_dir
    quality = {name: read(REPORT / f"{name}.test.json") for name in ("gemma", "minilm")}
    if quality["gemma"]["dataSha256"] != quality["minilm"]["dataSha256"]:
        raise ValueError("Models were evaluated on different data")
    runtime = {name: read(REPORT / f"{name}.runtime.cpu.json") for name in quality}
    if runtime["gemma"]["sampleIds"] != runtime["minilm"]["sampleIds"]:
        raise ValueError("Models were timed on different SMS")
    gpu = read(REPORT / "gemma.runtime.cuda.json")
    if gpu["sampleIds"] != runtime["gemma"]["sampleIds"]:
        raise ValueError("Gemma CPU/GPU timing samples differ")
    precisionParity = sum(
        a != b
        for a, b in zip(
            gpu["predictions"], runtime["gemma"]["predictions"], strict=True
        )
    )
    predictions = {
        name: [
            json.loads(line)
            for line in (ARTIFACTS / f"{name}.test.predictions.jsonl")
            .read_text()
            .splitlines()
        ]
        for name in quality
    }
    paired = {
        "bothCorrect": 0,
        "onlyGemmaCorrect": 0,
        "onlyMiniLmCorrect": 0,
        "bothWrong": 0,
    }
    examples = []
    for gemma, minilm in zip(predictions["gemma"], predictions["minilm"], strict=True):
        if (gemma["id"], gemma["code"], gemma["text"]) != (
            minilm["id"],
            minilm["code"],
            minilm["text"],
        ):
            raise ValueError("Prediction rows are misaligned")
        g, m = (
            gemma["prediction"] == gemma["code"],
            minilm["prediction"] == minilm["code"],
        )
        if g and m:
            paired["bothCorrect"] += 1
        elif g:
            paired["onlyGemmaCorrect"] += 1
        elif m:
            paired["onlyMiniLmCorrect"] += 1
        else:
            paired["bothWrong"] += 1
        if (
            gemma["language"] == "en"
            and gemma["prediction"] != minilm["prediction"]
            and len(examples) < 12
        ):
            examples.append(
                {
                    "id": gemma["id"],
                    "text": gemma["text"],
                    "expected": gemma["code"],
                    "gemma": gemma["prediction"],
                    "minilm": minilm["prediction"],
                }
            )
    result = {
        "datasetSha256": quality["gemma"]["dataSha256"],
        "metrics": {name: quality[name]["metrics"] for name in quality},
        "cpuLatency": {
            name: {
                key: runtime[name][key]
                for key in (
                    "p50EndToEndMs",
                    "p95EndToEndMs",
                    "meanEndToEndMs",
                    "loadSeconds",
                )
            }
            for name in quality
        },
        "gemmaGpuLatency": {
            key: gpu[key]
            for key in (
                "p50EndToEndMs",
                "p95EndToEndMs",
                "meanEndToEndMs",
                "loadSeconds",
            )
        },
        "gemmaCpuVsGpuPredictionDifferencesOn300Sms": precisionParity,
        "pairedExactMatch": paired,
        "exampleDisagreements": examples,
        "limitations": read(REPORT / "selection.json")["limitations"],
    }
    (REPORT / "comparison.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    )
    lines = [
        "EmbeddingGemma 2 candidate classifier vs MiniLM v3g",
        "",
        "Same 16,800 synthetic SMS, 30 languages, 8,400 codes and 8,400 no-code messages.",
        "Selection uses validation only, maximizing recall at 99.5% precision.",
        "",
        "Metric                         Gemma candidate       MiniLM v3g",
    ]
    for label, key in (
        ("Exact-code precision", "precision"),
        ("Code recovery / recall", "recall"),
        ("False-positive rate", "falsePositiveRate"),
        ("Overall exact match", "exactMatch"),
    ):
        g, m = (quality[name]["metrics"][key] * 100 for name in ("gemma", "minilm"))
        lines.append(f"{label:30} {g:9.2f}%          {m:9.2f}%")
    lines.append(
        f"{'False positives / 8,400':30} {quality['gemma']['metrics']['falsePositives']:10d}          {quality['minilm']['metrics']['falsePositives']:10d}"
    )
    for label, key in (
        ("CPU p50 per SMS (ms)", "p50EndToEndMs"),
        ("CPU p95 per SMS (ms)", "p95EndToEndMs"),
    ):
        lines.append(
            f"{label:30} {runtime['gemma'][key]:10.2f}          {runtime['minilm'][key]:10.2f}"
        )
    lines.extend(
        [
            "",
            f"Gemma GPU p50/p95: {gpu['p50EndToEndMs']:.2f}/{gpu['p95EndToEndMs']:.2f} ms per SMS.",
            f"Gemma CPU FP32 vs GPU BF16: {precisionParity}/300 output disagreements.",
            "",
            "Quality uses Gemma GPU BF16 embeddings and MiniLM compact ONNX CPU inference.",
            "CPU latency is sequential, four threads, the same 300 validation SMS, warm calls.",
            "It includes candidate enumeration, tokenization, inference and rejection.",
            "These are desktop measurements; Android was not measured.",
            "",
            "Gemma's encoder is frozen; its trained logistic regression selects among source",
            "spans. MiniLM's encoder and span/token heads were fine-tuned in the earlier run.",
            "This comparison does not test a fine-tuned Gemma span extractor.",
            "",
            *result["limitations"],
            "",
            "Sources, selected hyperparameters, per-language scores, environment and runtime",
            "details are alongside this file. Large checkpoints/feature caches remain ignored.",
        ]
    )
    (REPORT / "comparison.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
