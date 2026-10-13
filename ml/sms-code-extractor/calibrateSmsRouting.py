"""Calibrate language thresholds on validation, never relaxing the selected decoder."""

import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path

from smsData import ROOT


def score(rows: list[dict], threshold: float, margin: float) -> dict:
    accepted = [
        row
        for row in rows
        if row["candidate"]["code"] is not None
        and row["candidate"]["score"] > threshold
        and row["candidate"]["margin"] >= margin
    ]
    correct = sum(row["candidate"]["code"] == row["code"] for row in accepted)
    positives = sum(row["code"] is not None for row in rows)
    return {
        "returned": len(accepted),
        "correct": correct,
        "precision": correct / len(accepted) if accepted else 1.0,
        "recall": correct / positives if positives else 0.0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v3g")
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT.parents[1] / "android-app/app/src/main/assets/smsModelPolicy.json",
    )
    args = parser.parse_args()
    path = args.run / "validation.compact.predictions.jsonl"
    rows = [json.loads(line) for line in path.read_text().splitlines()]
    assert all("/validation/" in row["id"] for row in rows)
    decoder = json.loads((args.run / "onnx/decoder.json").read_text())
    languages = defaultdict(list)
    for row in rows:
        languages[row["language"]].append(row)
    policy, diagnostics = {}, {}
    for language, examples in sorted(languages.items()):
        floor = decoder["nullThreshold"]
        thresholds = [
            floor,
            *sorted(
                {
                    row["candidate"]["score"]
                    for row in examples
                    if row["candidate"]["score"] > floor
                }
            ),
        ]
        choices = []
        for threshold in thresholds:
            result = score(examples, threshold, decoder["minimumMargin"])
            if result["precision"] >= 0.97:
                choices.append(
                    (result["correct"], result["precision"], -threshold, result)
                )
        best = max(choices, key=lambda choice: choice[:3])
        policy[language] = {
            "nullThreshold": -best[2],
            "minimumMargin": decoder["minimumMargin"],
        }
        diagnostics[language] = best[3]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(
            {
                "languages": policy,
                "minimumLanguageConfidence": 0.8,
                "minimumLanguageMargin": 0.2,
            },
            indent=2,
        )
        + "\n"
    )
    report = ROOT / "reports/hybrid/calibration.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(
        json.dumps(
            {
                "targetPrecision": 0.97,
                "source": path.name,
                "sourceSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "policySha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                "notes": [
                    "Uses validation only, with dataset language labels. Does not establish accuracy of language detection.",
                    "Thresholds cannot be lower than the original selected decoder. Unknown/uncertain languages abstain.",
                    "Synthetic validation precision is not a deployment guarantee. Language-ID confidence gates are conservative routing rules, not calibrated probabilities of correct extraction.",
                ],
                "languages": diagnostics,
            },
            indent=2,
        )
        + "\n"
    )
    print(args.output)


if __name__ == "__main__":
    main()
