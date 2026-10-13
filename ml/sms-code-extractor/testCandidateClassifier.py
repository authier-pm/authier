"""Guard source-span extraction and candidate-to-message alignment."""

import numpy as np
from candidateClassifier import candidateRows, candidates, markedText, rankCandidates
from decodeSpans import acceptedCode
from smsData import normalizeMessage


def testCodesKeepCaseLeadingZeroesAndSeparatedCharacters():
    text = normalizeMessage("Code: ０ ０ １ ２ ３ ４. Another: qXaBpL.")
    found = {item.code: item for item in candidates(text)}
    assert "001234" in found
    assert "qXaBpL" in found
    assert "<candidate>qXaBpL</candidate>" in markedText(text, found["qXaBpL"])


def testNoCodeInventedOrTakenFromLink():
    text = "Link: https://example.com/?otp=123456. ID: 123456789012."
    codes = {item.code for item in candidates(text)}
    assert "123456" not in codes
    assert all(code in {"Link", "ID"} for code in codes)


def testGenerationNeverDependsOnGoldLabel():
    example = {"text": "Your code is qXaBpL.", "start": 13, "end": 19}
    first, texts = candidateRows([example])
    second, otherTexts = candidateRows([{**example, "start": -1, "end": -1}])
    assert texts == otherTexts
    assert [{k: v for k, v in row.items() if k != "label"} for row in first] == [
        {k: v for k, v in row.items() if k != "label"} for row in second
    ]
    assert sum(row["label"] for row in first) == 1
    assert sum(row["label"] for row in second) == 0


def testRankingDeduplicatesCodesAndHandlesMissingMessages():
    rows = [
        {"message": 0, "code": "001234", "start": 1, "end": 7},
        {"message": 0, "code": "001234", "start": 10, "end": 16},
        {"message": 0, "code": "654321", "start": 20, "end": 26},
        {"message": 2, "code": "AbCdEf", "start": 1, "end": 7},
    ]
    predictions = rankCandidates(rows, np.array([7, 8, 6, 4]), 3)
    assert predictions[0].code == "001234"
    assert predictions[0].margin == 2
    assert predictions[1].code is None
    assert predictions[2].code == "AbCdEf"
    assert acceptedCode(predictions[0], 7, 3) is None
    assert acceptedCode(predictions[0], 7, 1) == "001234"
