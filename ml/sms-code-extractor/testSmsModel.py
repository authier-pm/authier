"""Data leakage, coverage, normalization and abstention regression checks."""

import hashlib
import itertools
import json
import re
import string

import numpy as np
import onnx
import onnxruntime as ort
import pytest
import torch
from transformers import BertConfig

from smsData import (
    CONFIG,
    ROOT,
    buildDatasets,
    normalizeCode,
    normalizeMessage,
    readTemplates,
)
from revisionData import buildRevisionDatasets, readRevisionTemplates
from decodeSpans import Prediction, acceptedCode, decode, validSpan
from smsModel import calibrate, inputExample, loadModel, metrics
from SmsExtractor import SmsExtractor
from exportModel import (
    SpanModel,
    quantizeWordEmbeddingsPerRow,
    storeEncoderMatricesAsFloat16,
)


@pytest.fixture(scope="module")
def datasets():
    return buildDatasets()


def testAllLanguagesAndKindsInEverySplit(datasets):
    expected = {
        "en",
        "zh",
        "hi",
        "es",
        "ar",
        "fr",
        "bn",
        "pt",
        "id",
        "ur",
        "bg",
        "hr",
        "cs",
        "da",
        "nl",
        "et",
        "fi",
        "de",
        "el",
        "hu",
        "ga",
        "it",
        "lv",
        "lt",
        "mt",
        "pl",
        "ro",
        "sk",
        "sl",
        "sv",
    }
    assert set(readTemplates()) == expected
    for examples in datasets.values():
        assert {example["language"] for example in examples} == expected
        for language in expected:
            selected = [
                example for example in examples if example["language"] == language
            ]
            assert {example["kind"] for example in selected} == set(
                CONFIG["codeKinds"]
            ) | {"noCode"}
            for example in selected:
                if example["code"] is None:
                    assert example["start"] == example["end"] == -1
                else:
                    assert (
                        normalizeCode(
                            example["text"][example["start"] : example["end"]]
                        )
                        == example["code"]
                    )


def testNoCodeOrMessageOrFamilyLeakage(datasets):
    for left, right in itertools.combinations(datasets.values(), 2):
        for field in ("text", "code", "family"):
            leftValues = {example[field] for example in left} - {None}
            rightValues = {example[field] for example in right} - {None}
            assert not leftValues & rightValues, field


def testEvaluationSplitsStayFrozen(datasets):
    expected = {
        "validation": "f0b6013501298476a589bb7e95c1a0cd253f42369b9209ab5f9c5449e1b0e021",
        "test": "63f573c9647e1153ab444f0e88ca1515a237edc52604a2e3434f5ebe4c8367b5",
    }
    for split, digest in expected.items():
        data = "".join(
            json.dumps(example, ensure_ascii=False) + "\n"
            for example in datasets[split]
        )
        assert hashlib.sha256(data.encode()).hexdigest() == digest


def testAmbiguousCandidateCanAbstain():
    assert acceptedCode(Prediction("ABCD", 20, margin=0.1), 5, 1) is None
    assert acceptedCode(Prediction("ABCD", 20, margin=3), 5, 1) == "ABCD"


def testCalibrationCanUseMargin():
    examples = [
        dict(inputExample("OTP: ABCDEF"), code="ABCDEF"),
        inputExample("No code"),
    ]
    predictions = [
        Prediction("ABCDEF", 8, margin=4),
        Prediction("ZZZZZZ", 10, margin=0.1),
    ]
    threshold, result = calibrate(examples, predictions)
    assert result["minimumMargin"] > 0.1
    assert result["recall"] == result["precision"] == 1
    assert acceptedCode(predictions[0], threshold, result["minimumMargin"]) == "ABCDEF"


def testRandomLetterCoverage(datasets):
    for examples in datasets.values():
        for kind, alphabet in (
            ("lettersUpper", string.ascii_uppercase),
            ("lettersLower", string.ascii_lowercase),
            ("lettersMixed", string.ascii_letters),
        ):
            values = [
                example["code"] for example in examples if example["kind"] == kind
            ]
            assert len(values) > 100
            assert all(
                set(value) <= set(alphabet)
                and not any(char.isdigit() for char in value)
                for value in values
            )
            if kind == "lettersMixed":
                assert all(
                    not value.isupper() and not value.islower() for value in values
                )


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("aBcDeF", "aBcDeF"),
        ("00 12 34", "001234"),
        ("AB-CD-EF", "ABCDEF"),
        ("٠١٢٣٤٥", "012345"),
        ("۰۱۲۳۴۵", "012345"),
        ("०१२३४५", "012345"),
        ("০১২৩৪৫", "012345"),
        ("０１２３４５", "012345"),
        ("ab\u200bcd", "abcd"),
    ],
)
def testNormalizationPreservesCaseAndZeroes(raw, expected):
    assert normalizeCode(raw) == expected


def characterOffsets(text):
    return [(0, 0)] + [(index, index + 1) for index in range(len(text))] + [(0, 0)]


@pytest.mark.parametrize(
    "code", ["QXJK", "qxjk", "qXjK", "000173", "a7Bs2L", "AB CD EF"]
)
def testDecoderExtractsWholeCodeFromSource(code):
    text = f"Use {code} to sign in."
    offsets = characterOffsets(text)
    starts = np.full(len(offsets), -20.0)
    ends = starts.copy()
    starts[0] = ends[0] = 0.0
    starts[5] = 10
    ends[4 + len(code)] = 10
    result = decode(text, offsets, starts, ends)
    assert result.code == normalizeCode(code)
    assert text[result.start : result.end] == code


def testRejectCodeFragmentsAndLinks():
    assert validSpan("xxABCDEFyy", 2, 8, []) is None
    text = "https://example.invalid/?code=ABCDEF"
    assert validSpan(text, len(text) - 6, len(text), [(0, len(text))]) is None
    assert validSpan("验证码ABCDEF。", 3, 9, []) == "ABCDEF"
    assert validSpan("ABC DEF", 0, 7, []) == "ABCDEF"
    assert validSpan("A!BCDE", 0, 6, []) is None


@pytest.mark.parametrize("code", ["0012342", "qXaBpL", "1 9 1 0 8"])
@pytest.mark.parametrize(("prefix", "suffix"), [("", "."), ('"', '".'), ("「", "」。")])
def testDecoderHandlesPunctuationInsideBoundaryTokens(code, prefix, suffix):
    text = f"OTP: {prefix}{code}{suffix}"
    # Real SentencePiece offsets may merge the final digit and full stop.
    offsets = [
        (0, 0),
        (0, 4),
        (4, 6 + len(prefix)),
        (6 + len(prefix), len(text)),
        (0, 0),
    ]
    starts = np.array([0, -20, 10, -20, -20], dtype=float)
    ends = np.array([0, -20, -20, 10, -20], dtype=float)
    result = decode(text, offsets, starts, ends)
    assert result.code == normalizeCode(code)
    assert text[result.start : result.end] == code


def testPrecisionCountsWrongCodesAsErrors():
    examples = [
        dict(inputExample("code ABCDEF"), code="ABCDEF"),
        inputExample("No code"),
        dict(inputExample("code MNOPQR"), code="MNOPQR"),
    ]
    predictions = [
        Prediction("ABCDEF", 10),
        Prediction("WXYZAB", 8),
        Prediction("ZZZZZZ", 9),
    ]
    result = metrics(examples, predictions, 0)
    assert result["precision"] == 1 / 3
    assert result["recall"] == 1 / 2
    assert result["falsePositiveRate"] == 1
    threshold, selected = calibrate(examples, predictions)
    assert 9 < threshold < 10
    assert selected["precision"] == 1
    assert selected["recall"] == 1 / 2


def testNoGoodCalibrationAbstains():
    examples = [inputExample("No code")]
    threshold, result = calibrate(examples, [Prediction("ABCDEF", 10)])
    assert threshold > 10
    assert result["returnedCodes"] == 0


def testNormalizationIsIdempotent():
    value = "验证码：００１２３４\r\n\u200fHello"
    assert normalizeMessage(normalizeMessage(value)) == normalizeMessage(value)


@pytest.fixture(scope="module")
def revisionDatasets():
    return buildRevisionDatasets()


def testRevisionEvaluationIsFrozen(revisionDatasets):
    frozen = json.loads((ROOT / "data/v3Freeze.json").read_text())
    for split in ("validation", "test"):
        data = "".join(
            json.dumps(row, ensure_ascii=False) + "\n"
            for row in revisionDatasets[split]
        )
        assert len(revisionDatasets[split]) == frozen["evaluation"][split]["examples"]
        assert (
            hashlib.sha256(data.encode()).hexdigest()
            == frozen["evaluation"][split]["sha256"]
        )


def testRevisionCoversEveryLanguageAndKind(revisionDatasets):
    for examples in revisionDatasets.values():
        assert {row["language"] for row in examples} == set(CONFIG["languages"])
        for language in CONFIG["languages"]:
            selected = [row for row in examples if row["language"] == language]
            assert {row["kind"] for row in selected} == set(CONFIG["codeKinds"]) | {
                "noCode"
            }
        for row in examples:
            if row["code"] is None:
                assert row["start"] == row["end"] == -1
            else:
                assert (
                    normalizeCode(row["text"][row["start"] : row["end"]]) == row["code"]
                )


def testRevisionSplitsAndWarmStartCodesDoNotLeak(revisionDatasets, datasets):
    for left, right in itertools.combinations(revisionDatasets.values(), 2):
        for field in ("id", "text", "code", "family"):
            assert not ({row[field] for row in left} - {None}) & (
                {row[field] for row in right} - {None}
            )
    oldCodes = {row["code"] for rows in datasets.values() for row in rows} - {None}
    for split in ("validation", "test"):
        assert not oldCodes & {row["code"] for row in revisionDatasets[split]}


def testRevisionContrastExamplesIncludeLetterReferences(revisionDatasets):
    for language in CONFIG["languages"]:
        negatives = [
            row
            for row in revisionDatasets["train"]
            if row["language"] == language and row["code"] is None
        ]
        # New negative families carry code-shaped uppercase/lowercase references.
        assert any(
            "/lettersUpper/" in row["id"] and re.search(r"[A-Z]{4,10}", row["text"])
            for row in negatives
        )
        assert any(
            "/lettersLower/" in row["id"] and re.search(r"[a-z]{4,10}", row["text"])
            for row in negatives
        )
    templates = readRevisionTemplates()
    assert all(len(groups["test"]) == 16 for groups in templates.values())


@pytest.mark.parametrize(
    ("contrastive", "moreParaphrases", "matchedPairs", "targeted", "examples"),
    [
        (False, False, False, False, 52920),
        (True, False, False, False, 52920),
        (True, True, False, True, 0),
        (True, True, False, False, 49770),
        (True, True, True, False, 36750),
        (True, True, True, True, 28350),
    ],
)
def testEnrichedTrainingPreservesFrozenEvaluation(
    revisionDatasets, contrastive, moreParaphrases, matchedPairs, targeted, examples
):
    if targeted and not matchedPairs:
        with pytest.raises(ValueError, match="multilingual replay"):
            buildRevisionDatasets(
                True, contrastive, moreParaphrases, matchedPairs, targeted
            )
        return
    enriched = buildRevisionDatasets(
        enriched=True,
        contrastive=contrastive,
        moreParaphrases=moreParaphrases,
        matchedPairs=matchedPairs,
        targetedRefinements=targeted,
    )
    for split in ("validation", "test"):
        assert enriched[split] == revisionDatasets[split]
    assert len(enriched["train"]) == examples
    for left, right in itertools.combinations(enriched.values(), 2):
        for field in ("id", "text", "code", "family"):
            assert not ({row[field] for row in left} - {None}) & (
                {row[field] for row in right} - {None}
            )


def testPresenceGateKeepsSpanAndRejectsInvalidMessage():
    text = "Enter QXJMKL"
    offsets = characterOffsets(text)
    starts = np.full(len(offsets), -20.0)
    ends = starts.copy()
    starts[7] = ends[12] = 10
    candidate = decode(text, offsets, starts, ends, presenceScore=-4)
    assert candidate.code == "QXJMKL"
    assert candidate.score == -4
    assert acceptedCode(candidate, 0) is None
    assert acceptedCode(decode(text, offsets, starts, ends), 0) == "QXJMKL"
    tokenScores = np.full(len(offsets), -4.0)
    rejected = decode(
        text, offsets, starts, ends, presenceScore=8, tokenScores=tokenScores
    )
    assert rejected.code == "QXJMKL"
    assert acceptedCode(rejected, 0) is None
    tokenScores[7:13] = 3.0
    accepted = decode(
        text, offsets, starts, ends, presenceScore=-8, tokenScores=tokenScores
    )
    assert acceptedCode(accepted, 0) == "QXJMKL"


@pytest.mark.parametrize("labels", [[0, 0], [0, 2], [2, 2]])
@pytest.mark.parametrize("tokenHead", [False, True])
def testPresenceModelLossAndReload(tmp_path, labels, tokenHead):
    config = BertConfig(
        vocab_size=32,
        hidden_size=12,
        num_hidden_layers=1,
        num_attention_heads=3,
        intermediate_size=24,
        sms_token_head=tokenHead,
    )
    model = SmsExtractor(config)
    inputs = {
        "input_ids": torch.tensor([[1, 2, 3, 4], [1, 4, 3, 2]]),
        "attention_mask": torch.ones(2, 4, dtype=torch.long),
    }
    output = model(
        **inputs,
        start_positions=torch.tensor(labels),
        end_positions=torch.tensor(labels),
    )
    assert torch.isfinite(output.loss)
    output.loss.backward()
    assert torch.isfinite(model.code_presence.weight.grad).all()
    if tokenHead:
        assert torch.isfinite(model.code_tokens.weight.grad).all()
    model.eval().save_pretrained(tmp_path)
    restored = loadModel(tmp_path).eval()
    assert isinstance(restored, SmsExtractor)
    with torch.inference_mode():
        expected, actual = model(**inputs), restored(**inputs)
    for name in ("start_logits", "end_logits", "presence_logits"):
        torch.testing.assert_close(getattr(actual, name), getattr(expected, name))
    if tokenHead:
        torch.testing.assert_close(actual.code_token_logits, expected.code_token_logits)


@pytest.mark.parametrize("tokenHead", [False, True])
def testPresenceOnnxExportPreservesDynamicOutputs(tmp_path, tokenHead):
    config = BertConfig(
        vocab_size=32,
        hidden_size=12,
        num_hidden_layers=1,
        num_attention_heads=3,
        intermediate_size=24,
        sms_token_head=tokenHead,
    )
    model = SpanModel(SmsExtractor(config)).eval()
    names = ["start_logits", "end_logits", "presence_logits"]
    axes = {
        "input_ids": {0: "batch", 1: "sequence"},
        "attention_mask": {0: "batch", 1: "sequence"},
        "start_logits": {0: "batch", 1: "sequence"},
        "end_logits": {0: "batch", 1: "sequence"},
        "presence_logits": {0: "batch"},
    }
    if tokenHead:
        names.append("code_token_logits")
        axes["code_token_logits"] = {0: "batch", 1: "sequence"}
    path = tmp_path / "tiny.onnx"
    inputs = (torch.tensor([[1, 2, 3, 4]]), torch.ones(1, 4, dtype=torch.long))
    torch.onnx.export(
        model,
        inputs,
        str(path),
        input_names=["input_ids", "attention_mask"],
        output_names=names,
        dynamic_axes=axes,
        opset_version=17,
        dynamo=False,
    )
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    session = ort.InferenceSession(
        str(path), sess_options=options, providers=["CPUExecutionProvider"]
    )
    ids = torch.tensor([[1, 2, 3], [1, 3, 0]])
    mask = torch.tensor([[1, 1, 1], [1, 1, 0]])
    with torch.inference_mode():
        expected = model(ids, mask)
    actual = session.run(
        None, {"input_ids": ids.numpy(), "attention_mask": mask.numpy()}
    )
    assert len(actual) == len(names)
    assert actual[2].shape == (2,)
    for left, right in zip(expected, actual, strict=True):
        np.testing.assert_allclose(left.numpy(), right, atol=1e-5, rtol=1e-4)


def testPerRowEmbeddingsPreserveSmallRowsAndDynamicShapes():
    values = np.array(
        [
            [10000, -10000, 5000],
            [0.001, -0.002, 0.003],
            [0, 0, 0],
            [-0.25, 0.75, 1.25],
        ],
        dtype=np.float32,
    )
    weightName = "model.bert.embeddings.word_embeddings.weight"
    graph = onnx.helper.make_graph(
        [onnx.helper.make_node("Gather", [weightName, "ids"], ["embeddings"])],
        "row-embedding-test",
        [
            onnx.helper.make_tensor_value_info(
                "ids", onnx.TensorProto.INT64, [None, None]
            )
        ],
        [
            onnx.helper.make_tensor_value_info(
                "embeddings", onnx.TensorProto.FLOAT, [None, None, 3]
            )
        ],
        [onnx.numpy_helper.from_array(values, weightName)],
    )
    model = onnx.helper.make_model(
        graph, opset_imports=[onnx.helper.make_opsetid("", 17)], ir_version=10
    )
    quantizeWordEmbeddingsPerRow(model)
    onnx.checker.check_model(model)
    assert not any(value.name == weightName for value in model.graph.initializer)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    session = ort.InferenceSession(
        model.SerializeToString(),
        sess_options=options,
        providers=["CPUExecutionProvider"],
    )
    for ids in (
        np.array([[1, 2]], dtype=np.int64),
        np.array([[0, 1, 2], [3, 2, 1]], dtype=np.int64),
    ):
        actual = session.run(None, {"ids": ids})[0]
        expected = values[ids]
        maximum = np.max(np.abs(expected), axis=-1, keepdims=True)
        tolerances = maximum / 254 + 2 * np.finfo(np.float32).eps * maximum + 1e-10
        assert np.all(np.abs(actual - expected) <= tolerances)
    assert np.all(session.run(None, {"ids": np.array([[1]], dtype=np.int64)})[0] != 0)


def testFloat16StoragePreservesFloatEncoderExecution():
    rng = np.random.default_rng(42)
    weights = rng.normal(size=(32, 64)).astype(np.float32)
    graph = onnx.helper.make_graph(
        [onnx.helper.make_node("MatMul", ["input", "weights"], ["output"])],
        "float16-storage-test",
        [
            onnx.helper.make_tensor_value_info(
                "input", onnx.TensorProto.FLOAT, [None, 32]
            )
        ],
        [
            onnx.helper.make_tensor_value_info(
                "output", onnx.TensorProto.FLOAT, [None, 64]
            )
        ],
        [onnx.numpy_helper.from_array(weights, "weights")],
    )
    model = onnx.helper.make_model(
        graph, opset_imports=[onnx.helper.make_opsetid("", 17)], ir_version=10
    )
    storeEncoderMatricesAsFloat16(model)
    onnx.checker.check_model(model)
    assert model.graph.initializer[0].data_type == onnx.TensorProto.FLOAT16
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    session = ort.InferenceSession(
        model.SerializeToString(),
        sess_options=options,
        providers=["CPUExecutionProvider"],
    )
    values = rng.normal(size=(3, 32)).astype(np.float32)
    actual = session.run(None, {"input": values})[0]
    assert actual.dtype == np.float32
    expected = values @ weights.astype(np.float16).astype(np.float32)
    np.testing.assert_allclose(actual, expected, rtol=1e-5, atol=2e-6)
