"""Prepare the pinned, downloadable Android SMS model and tokenizer parity fixtures."""

import argparse
import hashlib
import json
import shutil
from collections import Counter
from pathlib import Path

import sentencepiece as spm
from smsData import ROOT, normalizeMessage
from tokenizers import Tokenizer


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fairseqId(token: int) -> int:
    if token == 0:
        return 3
    if token == 1:
        return 0
    if token == 2:
        return 2
    return token + 1


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v3g")
    parser.add_argument(
        "--output", type=Path, default=ROOT / "artifacts/android-sms-model"
    )
    parser.add_argument(
        "--vectors-output",
        type=Path,
        default=ROOT.parents[1]
        / "android-app/app/src/androidTest/assets/smsModelVectors.json",
    )
    args = parser.parse_args()
    source = args.run / "onnx"
    args.output.mkdir(parents=True, exist_ok=True)
    sentencepiece = spm.SentencePieceProcessor(
        model_file=str(source / "sentencepiece.bpe.model")
    )
    tokenizer = Tokenizer.from_file(str(source / "tokenizer.json"))
    tokenizer.no_padding()
    rows = [
        json.loads(line)
        for line in (args.run / "validation.compact.predictions.jsonl")
        .read_text()
        .splitlines()
    ]
    mismatches = []
    for row in rows:
        text = normalizeMessage(row["text"])
        ids = [0, *map(fairseqId, sentencepiece.encode(text)), 2]
        if ids != tokenizer.encode(text).ids:
            mismatches.append(row["id"])
    print(
        json.dumps(
            {
                "tokenizerComparisons": len(rows),
                "mismatches": mismatches[:10],
                "mismatchCount": len(mismatches),
            }
        )
    )
    if mismatches:
        raise ValueError("Mobile tokenizer differs from the selected model tokenizer")
    for name in ("model.int8.onnx", "sentencepiece.bpe.model", "baseModelLicense.txt"):
        shutil.copyfile(source / name, args.output / name)
    counts = Counter()
    vectors = []
    for row in rows:
        key = (row["language"], row["code"] is not None)
        if counts[key]:
            continue
        counts[key] += 1
        candidate = row["candidate"]
        vectors.append(
            {
                "text": row["text"],
                "language": row["language"],
                "code": candidate["code"],
                "score": candidate["score"],
                "margin": candidate["margin"],
            }
        )
    args.vectors_output.parent.mkdir(parents=True, exist_ok=True)
    args.vectors_output.write_text(
        json.dumps(vectors, ensure_ascii=False, indent=2) + "\n"
    )
    print(
        json.dumps(
            {
                path.name: {"sha256": digest(path), "bytes": path.stat().st_size}
                for path in args.output.iterdir()
                if path.is_file()
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
