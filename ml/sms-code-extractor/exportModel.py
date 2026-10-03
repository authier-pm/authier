"""Export a selected MiniLM checkpoint to ONNX and quantize weights, including embeddings.

This only creates local files. Test the quantized artifact with evaluateModel.py
before considering it for an Android integration.
"""

import argparse
import hashlib
import json
import shutil
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from onnx import TensorProto, helper, numpy_helper
from onnxruntime.quantization import QuantType, quantize_dynamic

from smsData import ROOT
from smsModel import loadModel, loadTokenizer


class SpanModel(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, input_ids, attention_mask):
        result = self.model(input_ids=input_ids, attention_mask=attention_mask)
        if getattr(result, "code_token_logits", None) is not None:
            return (
                result.start_logits,
                result.end_logits,
                result.presence_logits,
                result.code_token_logits,
            )
        if getattr(result, "presence_logits", None) is not None:
            return result.start_logits, result.end_logits, result.presence_logits
        return result.start_logits, result.end_logits


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def quantizeWordEmbeddingsPerRow(model: onnx.ModelProto) -> None:
    """Dequantize only looked-up rows, using portable standard ONNX operations.

    A single scale for the 96M-entry embedding table loses small row values to
    global outliers. Row scales preserve more precision with roughly 1 MB extra
    storage, without materializing the whole table in floating point at runtime.
    """
    weight = next(
        value
        for value in model.graph.initializer
        if value.name.endswith("word_embeddings.weight")
    )
    users = [node for node in model.graph.node if weight.name in node.input]
    if len(users) != 1 or users[0].op_type != "Gather":
        raise ValueError("Expected a single word-embedding Gather")
    gather = users[0]
    if any(
        attribute.name == "axis" and attribute.i != 0 for attribute in gather.attribute
    ):
        raise ValueError("Word embeddings must be gathered along vocabulary rows")
    values = numpy_helper.to_array(weight)
    if values.ndim != 2 or values.dtype != np.float32 or not np.isfinite(values).all():
        raise ValueError("Expected a finite FP32 word-embedding matrix")
    maximum = np.max(np.abs(values), axis=1, keepdims=True)
    scales = np.where(maximum > 0, maximum / 127.0, 1.0).astype(np.float32)
    quantized = np.clip(np.rint(values / scales), -127, 127).astype(np.int8)
    quantizedName, scalesName = weight.name + ".int8Rows", weight.name + ".rowScales"
    model.graph.initializer.remove(weight)
    model.graph.initializer.extend(
        [
            numpy_helper.from_array(quantized, quantizedName),
            numpy_helper.from_array(scales, scalesName),
        ]
    )
    prefix = gather.output[0]
    nodes = []
    for node in model.graph.node:
        if weight.name not in node.input:
            nodes.append(node)
            continue
        nodes.extend(
            [
                helper.make_node(
                    "Gather", [quantizedName, node.input[1]], [prefix + ".int8"], axis=0
                ),
                helper.make_node(
                    "Gather", [scalesName, node.input[1]], [prefix + ".scales"], axis=0
                ),
                helper.make_node(
                    "Cast",
                    [prefix + ".int8"],
                    [prefix + ".float"],
                    to=TensorProto.FLOAT,
                ),
                helper.make_node(
                    "Mul", [prefix + ".float", prefix + ".scales"], [prefix]
                ),
            ]
        )
    model.graph.ClearField("node")
    model.graph.node.extend(nodes)


def storeEncoderMatricesAsFloat16(model: onnx.ModelProto) -> None:
    """Reduce file size while keeping portable FP32 encoder computation.

    ONNX Runtime may fold these constant casts during loading. This saves storage,
    not encoder working memory; benchmark the resulting process separately.
    """
    casts = []
    for weight in list(model.graph.initializer):
        if (
            weight.data_type != TensorProto.FLOAT
            or len(weight.dims) != 2
            or np.prod(weight.dims) < 1024
            or weight.name.endswith(".rowScales")
        ):
            continue
        values = numpy_helper.to_array(weight)
        if (
            not np.isfinite(values).all()
            or np.max(np.abs(values)) > np.finfo(np.float16).max
        ):
            raise ValueError("Encoder matrix cannot be stored in FP16")
        storedName = weight.name + ".float16Storage"
        model.graph.initializer.remove(weight)
        model.graph.initializer.append(
            numpy_helper.from_array(values.astype(np.float16), storedName)
        )
        casts.append(
            helper.make_node("Cast", [storedName], [weight.name], to=TensorProto.FLOAT)
        )
    nodes = list(model.graph.node)
    model.graph.ClearField("node")
    model.graph.node.extend([*casts, *nodes])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, default=ROOT / "artifacts/minilm-v2")
    parser.add_argument(
        "--row-embeddings",
        action="store_true",
        help="Also export an INT8 variant with per-row embeddings and per-channel MatMul weights",
    )
    args = parser.parse_args()
    torch.set_num_threads(4)
    checkpointFile = args.run / "checkpoint/model.safetensors"
    checkpointHash = sha256(checkpointFile)
    model = loadModel(args.run / "checkpoint").eval()
    tokenizer = loadTokenizer(args.run / "checkpoint")
    directory = args.run / "onnx"
    directory.mkdir(exist_ok=True)
    fp32 = directory / "model.onnx"
    quantized = directory / "model.int8.onnx"
    sample = tokenizer("Your verification code is qXaBzP.", return_tensors="pt")
    outputNames = ["start_logits", "end_logits"]
    axes = {
        key: {0: "batch", 1: "sequence"}
        for key in ("input_ids", "attention_mask", *outputNames)
    }
    if getattr(model.config, "sms_presence_head", False):
        outputNames.append("presence_logits")
        axes["presence_logits"] = {0: "batch"}
    if getattr(model.config, "sms_token_head", False):
        outputNames.append("code_token_logits")
        axes["code_token_logits"] = {0: "batch", 1: "sequence"}
    torch.onnx.export(
        SpanModel(model).eval(),
        (sample["input_ids"], sample["attention_mask"]),
        str(fp32),
        input_names=["input_ids", "attention_mask"],
        output_names=outputNames,
        dynamic_axes=axes,
        opset_version=17,
        dynamo=False,
    )
    onnx.checker.check_model(str(fp32))
    # Quantizing only MatMul would leave the 96M-parameter embedding table in FP32.
    quantize_dynamic(
        str(fp32),
        str(quantized),
        weight_type=QuantType.QInt8,
        op_types_to_quantize=["MatMul", "Gather"],
        per_channel=False,
        extra_options={"MatMulConstBOnly": True},
    )
    onnx.checker.check_model(str(quantized))
    variants = [fp32, quantized]
    if args.row_embeddings:
        rowSource = directory / "model.rowEmbeddings.onnx"
        rowQuantized = directory / "model.rowEmbeddings.int8.onnx"
        rowModel = onnx.load(str(fp32))
        quantizeWordEmbeddingsPerRow(rowModel)
        onnx.checker.check_model(rowModel)
        onnx.save(rowModel, str(rowSource))
        del rowModel
        quantize_dynamic(
            str(rowSource),
            str(rowQuantized),
            weight_type=QuantType.QInt8,
            op_types_to_quantize=["MatMul"],
            per_channel=True,
            extra_options={"MatMulConstBOnly": True},
        )
        onnx.checker.check_model(str(rowQuantized))
        compact = directory / "model.compact.onnx"
        compactModel = onnx.load(str(rowSource))
        storeEncoderMatricesAsFloat16(compactModel)
        onnx.checker.check_model(compactModel)
        onnx.save(compactModel, str(compact))
        del compactModel
        variants.extend((rowSource, rowQuantized, compact))
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    session = ort.InferenceSession(
        str(fp32), sess_options=options, providers=["CPUExecutionProvider"]
    )
    maximumError = 0.0
    # Verify dynamic batch/sequence shapes and float export parity.
    for texts in (
        ["OTP: qXaBzP"],
        ["رمز التحقق هو 001234", "Ověřovací heslo: ABCDEF. Nikomu jej nesdělujte."],
    ):
        inputs = tokenizer(texts, padding=True, return_tensors="pt")
        with torch.inference_mode():
            expected = model(**inputs)
        actual = session.run(
            None, {key: value.numpy() for key, value in inputs.items()}
        )
        for reference, exported in zip(
            (getattr(expected, name) for name in outputNames), actual, strict=True
        ):
            error = float(np.max(np.abs(reference.numpy() - exported)))
            maximumError = max(maximumError, error)
            np.testing.assert_allclose(
                reference.numpy(), exported, rtol=1e-3, atol=1e-3
            )
    tokenizer.save_pretrained(directory)
    shutil.copyfile(ROOT / "baseModelLicense.txt", directory / "baseModelLicense.txt")
    (directory / "decoder.json").write_text((args.run / "decoder.json").read_text())
    if sha256(checkpointFile) != checkpointHash:
        raise ValueError(
            "Checkpoint changed during export; export the selected weights again"
        )
    manifest = {
        "checkpointSha256": checkpointHash,
        "floatParityMaxAbsoluteError": maximumError,
        "files": {
            path.name: {"bytes": path.stat().st_size, "sha256": sha256(path)}
            for path in variants
        },
        "baseLicense": "MIT",
        "baseModel": "https://huggingface.co/microsoft/Multilingual-MiniLM-L12-H384",
        "quantization": "Dynamic INT8 MatMul and Gather; embedding table included",
        "rowEmbeddingVariant": "Per-row INT8 word embeddings, per-channel dynamic INT8 MatMul; small position/type embeddings stay FP32"
        if args.row_embeddings
        else None,
        "compactVariant": "Per-row INT8 word embeddings, FP16 encoder matrix storage with FP32 computation. Constant casts may be expanded to FP32 on loading."
        if args.row_embeddings
        else None,
    }
    (args.run / "export.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
