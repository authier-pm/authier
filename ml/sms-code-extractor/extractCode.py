"""Extract a code locally from --text or stdin, printing only the code or null."""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

from decodeSpans import acceptedCode, decode
from smsData import ROOT, normalizeMessage


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v2")
    parser.add_argument("--text", help="SMS body; alternatively pass it on stdin")
    args = parser.parse_args()
    text = normalizeMessage(args.text if args.text is not None else sys.stdin.read())
    if len(text) > 32000:
        raise ValueError("SMS exceeds the 32,000-character input limit")
    decoder = json.loads((args.run / "onnx/decoder.json").read_text())
    tokenizer = Tokenizer.from_file(str(args.run / "onnx/tokenizer.json"))
    # Overlapping windows cover multipart messages instead of silently truncating.
    tokenizer.enable_truncation(max_length=decoder["maxTokens"], stride=64)
    encoded = tokenizer.encode(text)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(
        str(args.run / "onnx/model.int8.onnx"),
        sess_options=options,
        providers=["CPUExecutionProvider"],
    )
    codes = set()
    for window in [encoded, *encoded.overflowing]:
        outputs = session.run(
            None,
            {
                "input_ids": np.array([window.ids], dtype=np.int64),
                "attention_mask": np.array([window.attention_mask], dtype=np.int64),
            },
        )
        starts, ends = outputs[:2]
        presence = float(outputs[2][0]) if len(outputs) >= 3 else None
        tokens = outputs[3][0] if len(outputs) == 4 else None
        prediction = decode(
            text,
            window.offsets,
            starts[0],
            ends[0],
            presenceScore=presence,
            tokenScores=tokens,
        )
        code = acceptedCode(
            prediction, decoder["nullThreshold"], decoder.get("minimumMargin", 0.0)
        )
        if code is not None:
            codes.add(code)
    # Conflicting windows must abstain, not choose whichever window ran first.
    result = next(iter(codes)) if len(codes) == 1 else None
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
