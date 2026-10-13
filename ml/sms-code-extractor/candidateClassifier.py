"""Frozen EmbeddingGemma 2 features for source-span candidate classification."""

import re
from dataclasses import dataclass

import numpy as np
import torch
from decodeSpans import LINK, Prediction, validSpan
from sentence_transformers import SentenceTransformer
from smsData import Example, normalizeMessage

MODEL = "google/embeddinggemma-2"
REVISION = "914f7f89142e33e77833254d9c9b90c3cef7303b"
FORMAT_VERSION = 1
TOKEN = re.compile(r"[A-Za-z0-9]+")
GAP = re.compile(r"[\s·•\-]+\Z")


@dataclass(frozen=True)
class Candidate:
    code: str
    start: int
    end: int


def candidates(text: str) -> list[Candidate]:
    """Enumerate 4–10 ASCII character spans without a language keyword list.

    Whole tokens and adjacent separated tokens are eligible. Ordinary words are
    deliberately eligible too: lowercase-only codes must not need a dictionary.
    Candidate generation never reads labels or adds an oracle/gold candidate.
    """
    tokens = list(TOKEN.finditer(text))
    links = [(match.start(), match.end()) for match in LINK.finditer(text)]
    found = []
    for index, token in enumerate(tokens):
        length = 0
        for right in range(index, len(tokens)):
            current = tokens[right]
            if right > index and not GAP.fullmatch(
                text[tokens[right - 1].end() : current.start()]
            ):
                break
            length += len(current.group())
            if length > 10:
                break
            code = validSpan(text, token.start(), current.end(), links)
            if code is not None:
                found.append(Candidate(code, token.start(), current.end()))
    return found


def markedText(text: str, candidate: Candidate) -> str:
    return (
        text[: candidate.start]
        + "<candidate>"
        + text[candidate.start : candidate.end]
        + "</candidate>"
        + text[candidate.end :]
    )


def candidateRows(examples: list[Example]) -> tuple[list[dict], list[str]]:
    rows, texts = [], []
    for message, example in enumerate(examples):
        for candidate in candidates(example["text"]):
            rows.append(
                {
                    "message": message,
                    "code": candidate.code,
                    "start": candidate.start,
                    "end": candidate.end,
                    "label": int(
                        candidate.start == example["start"]
                        and candidate.end == example["end"]
                    ),
                }
            )
            texts.append(markedText(example["text"], candidate))
    return rows, texts


def rankCandidates(
    rows: list[dict], scores: np.ndarray, count: int
) -> list[Prediction]:
    grouped: list[dict[str, Prediction]] = [{} for _ in range(count)]
    for row, score in zip(rows, scores, strict=True):
        group = grouped[row["message"]]
        previous = group.get(row["code"])
        if previous is None or score > previous.score:
            group[row["code"]] = Prediction(
                row["code"], float(score), row["start"], row["end"]
            )
    predictions = []
    for group in grouped:
        ordered = sorted(group.values(), key=lambda item: item.score, reverse=True)
        if not ordered:
            predictions.append(Prediction(None, -1e6))
            continue
        best = ordered[0]
        if len(ordered) > 1:
            best.margin = best.score - ordered[1].score
        predictions.append(best)
    return predictions


class CandidateEncoder:
    def __init__(self, device: str, batchSize: int = 64):
        self.batchSize = batchSize
        dtype = torch.float32
        if device == "cuda":
            dtype = torch.bfloat16
        self.model = SentenceTransformer(
            MODEL,
            revision=REVISION,
            device=device,
            config_kwargs={"vision_config": None, "audio_config": None},
            model_kwargs={"torch_dtype": dtype},
        )
        self.model.max_seq_length = 512

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, 768), dtype=np.float32)
        # Refuse silent truncation; all compared examples must remain complete.
        prefix = self.model.prompts["Classification"]
        lengths = self.model.tokenizer(
            [prefix + text for text in texts], truncation=False, return_length=True
        )["length"]
        if max(lengths) > self.model.max_seq_length:
            raise ValueError(f"Candidate context would truncate: {max(lengths)} tokens")
        encoded = self.model.encode(
            texts,
            prompt_name="Classification",
            batch_size=self.batchSize,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        ).astype(np.float32)
        if not np.isfinite(encoded).all():
            raise ValueError("EmbeddingGemma produced non-finite features")
        return encoded

    def predict(self, text: str, weights: np.ndarray, bias: float) -> Prediction:
        text = normalizeMessage(text)
        found = candidates(text)
        rows = [
            {"message": 0, "code": item.code, "start": item.start, "end": item.end}
            for item in found
        ]
        vectors = self.encode([markedText(text, item) for item in found])
        return rankCandidates(rows, vectors @ weights + bias, 1)[0]
