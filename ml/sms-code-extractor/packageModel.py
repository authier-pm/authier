"""Bundle the evaluated INT8 prototype with its local inference command and report."""

import argparse
import hashlib
import json
import zipfile
from pathlib import Path

from smsData import ROOT


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v2")
    args = parser.parse_args()
    report = json.loads((args.run / "test.onnx.json").read_text())
    exported = json.loads((args.run / "export.json").read_text())
    expectedHash = exported["files"]["model.int8.onnx"]["sha256"]
    with (args.run / "onnx/model.int8.onnx").open("rb") as modelFile:
        actualHash = hashlib.file_digest(modelFile, "sha256").hexdigest()
    if actualHash != expectedHash:
        raise ValueError("Model changed since export/evaluation")
    if report.get("modelSha256", actualHash) != actualHash:
        raise ValueError("Packaged model differs from the evaluated model")
    decoder = json.loads((args.run / "onnx/decoder.json").read_text())
    decoderHash = hashlib.sha256(
        json.dumps(decoder, sort_keys=True).encode()
    ).hexdigest()
    if report.get("decoderSha256", decoderHash) != decoderHash:
        raise ValueError("Packaged decoder differs from the evaluated decoder")
    paths = {
        f"onnx/{name}": args.run / "onnx" / name
        for name in (
            "model.int8.onnx",
            "tokenizer.json",
            "decoder.json",
            "baseModelLicense.txt",
        )
    }
    for name in (
        "extractCode.py",
        "decodeSpans.py",
        "smsData.py",
        "experiment.json",
        "inferenceRequirements.txt",
    ):
        paths[name] = ROOT / name
    for name in ("test.onnx.json", "export.json", "benchmark.json"):
        paths[f"reports/{name}"] = args.run / name
    if (args.run / "selection.json").exists():
        paths["reports/selection.json"] = args.run / "selection.json"
    paths["codeLicense.txt"] = ROOT.parents[1] / "LICENSE"
    variant = "compact" if exported.get("selectedVariant") else "int8"
    output = args.run / f"minilm-sms-30-languages-{variant}.zip"
    overall = report["overall"]
    instructions = f"""Authier MiniLM SMS extractor — evaluated prototype

NOT READY FOR APP INTEGRATION. All metrics below are synthetic, held-out data.
Model format: {exported["quantization"]}
Test: {overall["examples"]} messages across 30 languages.
Precision: {overall["precision"]:.2%}; code recovery: {overall["recall"]:.2%}.
False codes in messages without a valid code: {overall["falsePositives"]} / {overall["negatives"]}.
See reports/test.onnx.json for every supported language and code category.
No physical Android handset measurements have been performed.

Extract this archive and run from its directory with Python 3.12+:
  python -m venv .venv
  .venv/bin/python -m pip install -r inferenceRequirements.txt
  .venv/bin/python extractCode.py --run . --text 'Your verification code is qXaBpL.'

Inference is local after dependencies are installed. The model reads the supplied
text only; it does not access an SMS inbox or make an API request. Output is a JSON
string or null. Letter case and leading zeroes are preserved. Eligible codes use
4–10 Latin letters/digits after Unicode normalization. Long inputs use overlapping
windows; conflicting accepted answers abstain.

The base model's MIT license is in onnx/baseModelLicense.txt; the Authier code
license is codeLicense.txt. SHA-256 checksums are in manifest.json.
"""
    manifest = {}
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for name, path in sorted(paths.items()):
            content = path.read_bytes()
            manifest[name] = {
                "bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
            }
            archive.writestr(name, content)
        archive.writestr("usage.txt", instructions)
        archive.writestr("manifest.json", json.dumps(manifest, indent=2) + "\n")
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise ValueError("Archive checksum verification failed")
    print(json.dumps({"archive": str(output), "bytes": output.stat().st_size}))


if __name__ == "__main__":
    main()
