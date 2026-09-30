"""Bounded span decoding shared by training evaluation and the lightweight runtime."""

import re
from dataclasses import dataclass

import numpy as np

from smsData import normalizeCode

CODE = re.compile(r"[A-Za-z0-9](?:[A-Za-z0-9\s·•\-]*[A-Za-z0-9])?\Z")
LINK = re.compile(r"https?://\S+|www\.\S+|\S+@\S+\.\S+", re.IGNORECASE)
BOUNDARY_PUNCTUATION = frozenset(".,:;!?()[]{}<>\"'。！？、，：；（）「」『』«»“”‘’")


@dataclass
class Prediction:
    code: str | None
    score: float
    start: int = -1
    end: int = -1
    margin: float = 1e6


def acceptedCode(
    prediction: Prediction, threshold: float, minimumMargin: float = 0.0
) -> str | None:
    if prediction.score > threshold and prediction.margin >= minimumMargin:
        return prediction.code
    return None


def validSpan(
    text: str, start: int, end: int, links: list[tuple[int, int]]
) -> str | None:
    raw = text[start:end]
    if not raw or not CODE.fullmatch(raw) or len(raw) > 40:
        return None
    # Refuse fragments of ASCII words/codes. Non-Latin prose may adjoin Latin OTPs.
    if (
        start
        and text[start - 1]
        in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ):
        return None
    if (
        end < len(text)
        and text[end]
        in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ):
        return None
    if any(start < right and end > left for left, right in links):
        return None
    code = normalizeCode(raw)
    if not 4 <= len(code) <= 10:
        return None
    return code


def decode(
    text: str,
    offsets: list[tuple[int, int]],
    starts: np.ndarray,
    ends: np.ndarray,
    presenceScore: float | None = None,
    tokenScores: np.ndarray | None = None,
) -> Prediction:
    """Select an existing 4–10 character code and a calibrated acceptance score.

    All letters-only candidates are eligible, including lowercase. No language
    keyword list, sender allowlist or digit requirement is applied.
    Presence-head models supply their message-level logit; older models use the
    best span score minus the CLS (no-code) score. Neither model generates text.
    Token-supervised models instead score the selected span using its mean
    token-validity logit, which can reject references within login-related SMS.
    """
    links = [(match.start(), match.end()) for match in LINK.finditer(text)]
    null = float(starts[0] + ends[0])
    candidates: dict[str, Prediction] = {}
    candidateConfidence: dict[str, float] = {}
    # The top 24 endpoints retain cheap bounded decoding for short SMS messages.
    lefts = np.argsort(starts[: len(offsets)])[::-1][:24]
    rights = np.argsort(ends[: len(offsets)])[::-1][:24]
    for left in lefts:
        if left == 0 or offsets[left][0] == offsets[left][1]:
            continue
        for right in rights:
            if (
                right < left
                or right - left > 32
                or offsets[right][0] == offsets[right][1]
            ):
                continue
            score = float(starts[left] + ends[right]) - null
            start, end = offsets[left][0], offsets[right][1]
            # SentencePiece may combine code characters with punctuation ("2.")
            # or leading whitespace. Keep exact character boundaries inside
            # those tokens instead of rejecting or shortening a valid code.
            while start < end and (
                text[start].isspace() or text[start] in BOUNDARY_PUNCTUATION
            ):
                start += 1
            while end > start and (
                text[end - 1].isspace() or text[end - 1] in BOUNDARY_PUNCTUATION
            ):
                end -= 1
            code = validSpan(text, start, end, links)
            if code is not None and (
                code not in candidates or score > candidates[code].score
            ):
                candidates[code] = Prediction(code, score, start, end)
                if tokenScores is not None:
                    candidateConfidence[code] = float(
                        np.mean(tokenScores[left : right + 1])
                    )
    if not candidates:
        return Prediction(None, -1e6)
    ranked = sorted(
        candidates.values(), key=lambda candidate: candidate.score, reverse=True
    )
    best = ranked[0]
    if len(ranked) > 1:
        best.margin = best.score - ranked[1].score
    if tokenScores is not None:
        best.score = candidateConfidence[best.code]
    elif presenceScore is not None:
        best.score = float(presenceScore)
    return best
