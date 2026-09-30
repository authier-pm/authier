"""Desktop CPU inference measurements in a fresh process without PyTorch.

These measurements are NOT Android/4 GB handset measurements. Load time excludes
Python imports; inference time excludes tokenization and span decoding.
"""

import argparse
import json
import time
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

from smsData import ROOT, readSplit


def processMemory() -> dict[str, int]:
    # Linux resets /proc/self/status high-water RSS on exec. getrusage().ru_maxrss
    # can retain the launching process's much larger peak and inflate this result.
    values = {}
    for line in Path("/proc/self/status").read_text().splitlines():
        key, _, value = line.partition(":")
        if key in ("VmRSS", "VmHWM"):
            values[key] = int(value.split()[0]) * 1024
    return values


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v2")
    args = parser.parse_args()
    training = json.loads((args.run / "training.json").read_text())
    dataDirectory = Path(training.get("dataDirectory", ROOT / "data/generated"))
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    started = time.monotonic()
    tokenizer = Tokenizer.from_file(str(args.run / "onnx/tokenizer.json"))
    session = ort.InferenceSession(
        str(args.run / "onnx/model.int8.onnx"),
        sess_options=options,
        providers=["CPUExecutionProvider"],
    )
    loadSeconds = time.monotonic() - started
    examples = readSplit("validation", dataDirectory)
    latencies = []
    lengths = []
    # One message from each of ten random rows per language, a fixed 300 inputs.
    counts = {}
    for example in examples:
        language = example["language"]
        if counts.get(language, 0) >= 10:
            continue
        counts[language] = counts.get(language, 0) + 1
        encoded = tokenizer.encode(example["text"])
        inputs = {
            "input_ids": np.array([encoded.ids], dtype=np.int64),
            "attention_mask": np.array([encoded.attention_mask], dtype=np.int64),
        }
        before = time.monotonic()
        session.run(None, inputs)
        latencies.append((time.monotonic() - before) * 1000)
        lengths.append(len(encoded.ids))
    memory = processMemory()
    result = {
        "platform": "Linux x86_64, AMD Ryzen 9 9900X, ONNX CPU, 4 threads",
        "androidMeasured": False,
        "modelLoadSeconds": loadSeconds,
        "messages": len(latencies),
        "batchSize": 1,
        "dataDirectory": str(dataDirectory),
        "p50InferenceMs": float(np.percentile(latencies, 50)),
        "p95InferenceMs": float(np.percentile(latencies, 95)),
        "peakProcessRssBytes": memory["VmHWM"],
        "residentProcessRssBytes": memory["VmRSS"],
        "memoryMethod": "Linux /proc/self/status VmHWM and VmRSS in a fresh process",
        "medianTokens": float(np.median(lengths)),
        "maxTokens": max(lengths),
        "caveats": [
            "Desktop measurement, not a 4 GB Android device.",
            "Model load may benefit from the OS disk cache.",
            "Latency excludes tokenization and decoding; RSS includes tokenizer and runtime.",
        ],
    }
    (args.run / "benchmark.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
