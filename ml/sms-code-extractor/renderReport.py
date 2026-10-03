"""Create a standalone evaluation report and small, check-in-ready result files."""

import argparse
import html
import json
import shutil
from pathlib import Path

from smsData import ROOT


def percent(value: float) -> str:
    return f"{100 * value:.2f}%"


def lettersRecall(report: dict, language: str | None = None) -> float:
    kinds = report["byCodeKind"]
    if language is not None:
        kinds = report["byLanguageAndCodeKind"][language]
    letters = [kinds[name] for name in ("lettersUpper", "lettersLower", "lettersMixed")]
    return sum(group["correctCodes"] for group in letters) / sum(
        group["positives"] for group in letters
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v2")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "reports")
    parser.add_argument(
        "--baseline",
        type=Path,
        help="Previous checkpoint evaluated on the SAME test corpus",
    )
    args = parser.parse_args()
    floatReport = json.loads((args.run / "test.torch.json").read_text())
    intReport = json.loads((args.run / "test.onnx.json").read_text())
    training = json.loads((args.run / "training.json").read_text())
    exported = json.loads((args.run / "export.json").read_text())
    benchmark = json.loads((args.run / "benchmark.json").read_text())
    modelLabel = "compact" if exported.get("selectedVariant") else "INT8"
    baseline = None
    if args.baseline:
        baseline = json.loads(args.baseline.read_text())
        if baseline["dataset"]["sha256"] != intReport["dataset"]["sha256"]:
            raise ValueError("Cannot compare scores from different test sets")
    rows = []
    for language, values in sorted(
        intReport["byLanguage"].items(),
        key=lambda pair: intReport["languageNames"][pair[0]],
    ):
        floatValues = floatReport["byLanguage"][language]
        rows.append(f"""<tr><th>{html.escape(intReport["languageNames"][language])} <small>{language}</small></th>
        <td>{values["examples"]}</td><td>{percent(floatValues["recall"])}</td>
        <td>{percent(values["recall"])}</td><td>{percent(values["precision"])}</td>
        <td>{percent(lettersRecall(intReport, language))}</td>
        <td>{values["falsePositives"]} / {values["negatives"]}</td></tr>""")
    kindRows = "".join(
        f"<tr><th>{html.escape(kind)}</th><td>{values['examples']}</td>"
        f"<td>{percent(values['exactMatch'])}</td><td>{values['correctCodes']} / {values['positives']}</td></tr>"
        for kind, values in intReport["byCodeKind"].items()
    )
    overall = intReport["overall"]
    overallLettersRecall = lettersRecall(intReport)
    languagesAbove95 = sum(
        lettersRecall(intReport, language) > 0.95
        for language in intReport["byLanguage"]
    )
    target = (
        "Letters-only recovery exceeds 95%."
        if overallLettersRecall > 0.95
        else "Letters-only recovery remains below the target."
    )
    if overall["precision"] < 0.995:
        target += " The 99.5% precision target is not met."
    else:
        target += " The 99.5% precision target is also met."
    comparison = ""
    if baseline:
        baselineRows = "".join(
            f"<tr><th>{html.escape(intReport['languageNames'][language])}</th>"
            f"<td>{percent(lettersRecall(baseline, language))}</td>"
            f"<td>{percent(lettersRecall(intReport, language))}</td>"
            f"<td>{percent(baseline['byLanguage'][language]['precision'])}</td>"
            f"<td>{percent(intReport['byLanguage'][language]['precision'])}</td></tr>"
            for language in sorted(
                intReport["byLanguage"], key=lambda key: intReport["languageNames"][key]
            )
        )
        comparison = f"""<h2>Previous checkpoint versus this revision</h2>
        <p>Both checkpoints use the same new frozen test set and batch-one ONNX inference.
        Each decoder is calibrated on the same new validation set; baseline weights stay unchanged.
        The older checkpoint met the validation precision target only by abstaining on almost every message,
        so its recovery at this operating point is near zero. Its earlier 90% letters-only result used
        a different test set and decoder, and is not directly comparable to these scores.
        Baseline letters-only recovery: {percent(lettersRecall(baseline))}; new revision: {percent(overallLettersRecall)}.
        Baseline precision: {percent(baseline["overall"]["precision"])}; new revision: {percent(overall["precision"])}.</p>
        <div class="table"><table><thead><tr><th>Language</th><th>Previous letters recovery</th><th>New letters recovery</th><th>Previous precision</th><th>New precision</th></tr></thead><tbody>{baselineRows}</tbody></table></div>"""
    failed = []
    seenLanguages = set()
    predictions = (args.run / "test.onnx.predictions.jsonl").read_text().splitlines()
    for line in predictions:
        example = json.loads(line)
        if (
            example["prediction"] == example["code"]
            or example["language"] in seenLanguages
        ):
            continue
        seenLanguages.add(example["language"])
        failed.append(
            f"<tr><th>{example['language']}</th><td dir='auto'>{html.escape(example['text'])}</td>"
            f"<td><code>{html.escape(str(example['code']))}</code></td>"
            f"<td><code>{html.escape(str(example['prediction']))}</code></td></tr>"
        )
    limitations = "".join(
        f"<li>{html.escape(value)}</li>" for value in intReport["limitations"]
    )
    document = f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Authier · MiniLM SMS extraction evaluation</title>
    <style>
    :root{{color-scheme:light dark;font:16px/1.55 system-ui,sans-serif;background:#0d1919;color:#e7f0ed}}
    body{{max-width:1150px;margin:40px auto;padding:0 24px}}h1{{font-size:34px;letter-spacing:-.7px;line-height:1.2}}
    h2{{margin-top:38px;font-size:23px}}p{{max-width:900px;color:#bed0ca}}small{{color:#94aaa3;margin-left:8px}}
    .cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:25px 0}}
    .card{{padding:18px;background:#182c29;border:1px solid #304b43;border-radius:12px}}.card strong{{display:block;font-size:27px;color:#9bd2b6}}
    .note{{padding:16px 20px;border-left:4px solid #dab776;background:#302b20;color:#eddec5}}
    .table{{overflow:auto}}table{{width:100%;border-collapse:collapse;font-size:14px}}th,td{{text-align:left;padding:10px 12px;border-bottom:1px solid #29403a}}
    thead th{{color:#9bd2b6;background:#142622}}tbody th{{font-weight:500}}td{{font-variant-numeric:tabular-nums}}
    code{{font-size:13px;overflow-wrap:anywhere}}li{{color:#bed0ca}}a{{color:#9bd2b6}}summary{{cursor:pointer;margin:18px 0}}
    </style><body>
    <p>AUTHIER · LOCAL MODEL EXPERIMENT</p><h1>MiniLM SMS extraction<br>30-language evaluation</h1>
    <p>Selected epoch {intReport["checkpointEpoch"]}. The final test set was held out from training, checkpoint selection,
    and abstention-threshold calibration. Both FP32 and {modelLabel} versions were evaluated.
    Final {modelLabel} evaluation uses one unpadded SMS per inference, matching the local extraction command.</p>
    <div class="note"><strong>{target}</strong> Held-out extraction precision is {percent(overall["precision"])};
    {percent(overall["falsePositiveRate"])} of messages without a verification code incorrectly produce one.
    Synthetic results do not establish real-world accuracy or performance on a 4 GB Android phone.</div>
    <div class="cards"><div class="card"><strong>{overall["examples"]:,}</strong>held-out messages</div>
    <div class="card"><strong>{percent(overall["recall"])}</strong>correct code recovery · {modelLabel}</div>
    <div class="card"><strong>{percent(overall["precision"])}</strong>extraction precision · {modelLabel}</div>
    <div class="card"><strong>{percent(overallLettersRecall)}</strong>letters-only recovery · {modelLabel}</div>
    <div class="card"><strong>{exported["files"]["model.int8.onnx"]["bytes"] / 1e6:.1f} MB</strong>{modelLabel} model weights</div></div>
    <h2>What was trained and tested</h2><p>{training["dataset"]["train"]["examples"]:,} training messages,
    {training["dataset"]["validation"]["examples"]:,} validation messages, and {overall["examples"]:,} test messages.
    Translated template families, synthetic brands and generated codes are split globally. Repeating a template with
    different codes creates correlated examples, not independent evidence of language understanding.</p>
    <p>Codes contain 4–10 characters: digits, random uppercase/lowercase/mixed-case Latin letters, mixtures of letters
    and digits, and separated characters. Unicode decimal digits are normalized. Case and leading zeroes are preserved.
    Each language has {overall["positives"] // len(intReport["byLanguage"])} code-bearing and {overall["negatives"] // len(intReport["byLanguage"])} no-code test messages,
    including {sum(intReport["byCodeKind"][kind]["positives"] for kind in ("lettersUpper", "lettersLower", "lettersMixed")) // len(intReport["byLanguage"])} letters-only cases.
    Letters-only recovery exceeds 95% in {languagesAbove95} of {len(intReport["byLanguage"])} languages.</p>
    <h2>Every supported language</h2><p>Recovery means the exact code was returned. Precision counts a wrong code as an error,
    including choosing an obsolete code. False positives are codes returned for messages with no valid verification code.</p>
    <div class="table"><table><thead><tr><th>Language</th><th>Cases</th><th>FP32 recovery</th><th>{modelLabel.capitalize()} recovery</th><th>{modelLabel.capitalize()} precision</th><th>Letters-only recovery</th><th>False positives</th></tr></thead>
    <tbody>{"".join(rows)}</tbody></table></div>
    <h2>Code categories · {modelLabel}</h2><div class="table"><table><thead><tr><th>Category</th><th>Cases</th><th>Exact match</th><th>Correct codes / code-bearing cases</th></tr></thead>
    <tbody>{kindRows}</tbody></table></div>
    {comparison}
    <h2>Model storage and computation</h2><p>{html.escape(exported["quantization"])}.
    The reported file size is distinct from working memory, measured below.</p>
    <h2>Desktop measurements</h2><p>{html.escape(benchmark["platform"])}. Batch size one, {benchmark["messages"]} validation messages.
    Median inference {benchmark["p50InferenceMs"]:.1f} ms; p95 {benchmark["p95InferenceMs"]:.1f} ms.
    Median input {benchmark["medianTokens"]:.0f} tokens; longest {benchmark["maxTokens"]} tokens.
    Peak process RSS {benchmark["peakProcessRssBytes"] / 1e6:.1f} MB;
    resident RSS after inference {benchmark["residentProcessRssBytes"] / 1e6:.1f} MB.
    Memory is measured from Linux /proc/self/status in a fresh process. Model load {benchmark["modelLoadSeconds"]:.2f} s.
    Latency excludes tokenization and span decoding. Disk caching can reduce load time. These are not Android measurements.</p>
    <h2>Limits and outstanding validation</h2><ul>{limitations}</ul>
    <details><summary>Example failures, at most one per language</summary><div class="table"><table><thead><tr><th>Language</th><th>Synthetic SMS</th><th>Expected</th><th>Returned</th></tr></thead>
    <tbody>{"".join(failed)}</tbody></table></div></details>
    <h2>Reproducibility</h2><p>Training and evaluation scripts, seed, language templates, dependency versions and data hashes
    are checked in beside this report. Large weights and generated message files remain local in the ignored artifacts and data/generated directories.</p>
    <p>Base: <a href="https://huggingface.co/microsoft/Multilingual-MiniLM-L12-H384">Microsoft Multilingual MiniLM L12 H384</a>,
    revision <code>{training["config"]["baseRevision"]}</code>. Selected weights, decoder thresholds and ONNX SHA-256 checksums accompany the local model.</p>
    </body></html>"""
    destination = args.output_dir
    destination.mkdir(parents=True, exist_ok=True)
    (destination / "evaluation.html").write_text(document)
    for name in (
        "test.torch.json",
        "test.onnx.json",
        "training.json",
        "export.json",
        "benchmark.json",
    ):
        shutil.copyfile(args.run / name, destination / name)
    for name in ("selection.json", "validation.torch.json", "validation.onnx.json"):
        if (args.run / name).exists():
            shutil.copyfile(args.run / name, destination / name)
    if args.baseline:
        shutil.copyfile(args.baseline, destination / "baseline.onnx.json")
    print(destination / "evaluation.html")


if __name__ == "__main__":
    main()
