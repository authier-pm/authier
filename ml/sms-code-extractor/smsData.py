"""Reproducible synthetic SMS data. Splits hold out entire translated families.

Python is confined to offline ML tooling; the application runtime remains Bun.
Only the checked-in synthetic templates are read, never the user's SMS inbox.
"""

import hashlib
import json
import random
import re
import string
import unicodedata
from pathlib import Path
from typing import TypedDict

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "experiment.json").read_text())
SPLITS = ("train", "validation", "test")
BRANDS = {
    "train": ("Novera", "Birch", "Kestrel", "Lumio", "Fable"),
    "validation": ("Aster", "Velora", "Pollen"),
    "test": ("Cobalt", "Marula", "Tern"),
}
DIGITS = (
    "٠١٢٣٤٥٦٧٨٩",
    "۰۱۲۳۴۵۶۷۸۹",
    "०१२३४५६७८९",
    "০১২৩৪৫৬৭৮৯",
    "０１２３４５６７８９",
)
INVISIBLE = re.compile(r"[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]")
SEPARATORS = re.compile(r"[\s·•\-]+")


class Example(TypedDict):
    id: str
    language: str
    family: str
    kind: str
    text: str
    code: str | None
    start: int
    end: int


def normalizeMessage(text: str) -> str:
    """NFKC + decimal digits, retaining case, leading zeroes and line breaks."""
    text = INVISIBLE.sub("", unicodedata.normalize("NFKC", text))
    text = (
        re.sub(r"[\u2010-\u2015\u2212]", "-", text)
        .replace("\r\n", "\n")
        .replace("\r", "\n")
    )
    return "".join(
        str(unicodedata.decimal(char)) if char.isdecimal() else char for char in text
    )


def normalizeCode(text: str) -> str:
    return SEPARATORS.sub("", normalizeMessage(text))


def readTemplates() -> dict[str, dict[str, list[str] | str]]:
    templates = {}
    for path in sorted((ROOT / "data").glob("*Templates.json")):
        document = json.loads(path.read_text())
        assert not templates.keys() & document.keys(), f"Repeated language in {path}"
        templates.update(document)
    assert set(templates) == set(CONFIG["languages"])
    for language, entries in templates.items():
        seen = set()
        for split in SPLITS:
            values = entries[split]
            assert len(values) == len(set(values)), (
                language,
                split,
                "duplicate template",
            )
            assert not seen & set(values), (language, split, "template leakage")
            seen.update(values)
            assert any("{code}" in value for value in values)
            assert any("{code}" not in value for value in values)
    return templates


def randomCode(rng: random.Random, kind: str, used: set[str]) -> str:
    while True:
        length = rng.choice(CONFIG["codeLengths"])
        if kind in ("numeric", "unicodeDigits"):
            code = "".join(rng.choices(string.digits, k=length))
            if rng.random() < 0.25:
                code = "0" + code[1:]
        elif kind == "lettersUpper":
            code = "".join(rng.choices(string.ascii_uppercase, k=length))
        elif kind == "lettersLower":
            code = "".join(rng.choices(string.ascii_lowercase, k=length))
        elif kind == "lettersMixed":
            code = rng.choice(string.ascii_uppercase) + rng.choice(
                string.ascii_lowercase
            )
            code += "".join(rng.choices(string.ascii_letters, k=length - 2))
        elif kind in ("alphanumeric", "separated"):
            pool = string.ascii_letters + string.digits
            if kind == "separated":
                pool = rng.choice(
                    (string.digits, string.ascii_uppercase, string.ascii_letters, pool)
                )
            code = "".join(rng.choices(pool, k=length))
            if kind == "alphanumeric":
                code = (
                    rng.choice(string.ascii_letters)
                    + rng.choice(string.digits)
                    + code[2:]
                )
        else:
            raise ValueError(kind)
        if code not in used:
            used.add(code)
            break
    if kind == "unicodeDigits":
        code = code.translate(str.maketrans(string.digits, rng.choice(DIGITS)))
    if kind == "separated":
        width = rng.choice((1, 2, 3))
        separator = rng.choice((" ", "-", "\n", "\u2009", "·"))
        code = separator.join(
            code[index : index + width] for index in range(0, len(code), width)
        )
    return code


def renderExample(
    template: str,
    language: str,
    split: str,
    index: int,
    kind: str,
    repeat: int,
    rng: random.Random,
    used: set[str],
    *,
    brands: tuple[str, ...] | None = None,
    reserveOnlyUsed: bool = False,
    referenceKind: str | None = None,
) -> Example:
    def draw(name: str) -> str:
        if reserveOnlyUsed and "{" + name + "}" not in template:
            return ""
        return randomCode(rng, kind, used)

    code = draw("code")
    values = {
        "code": "<ANSWER>" + code + "</ANSWER>",
        "old": draw("old"),
        "other": draw("other"),
        "brand": rng.choice(brands or BRANDS[split]),
        "minutes": str(rng.choice((2, 3, 5, 10, 15, 30))),
        "duration": str(rng.choice((1200, 1800, 2400, 3600, 7200))),
        "amount": f"{rng.randint(10, 9000)}.{rng.randint(0, 99):02d}",
        "card": f"{rng.randint(0, 9999):04d}",
        "id": str(rng.randint(10000, 99999999)),
        "percent": str(rng.choice((10, 15, 20, 25, 30, 50))),
        "phone": f"+420 {rng.randint(100, 999)} {rng.randint(100, 999)} {rng.randint(100, 999)}",
        "time": f"{rng.randint(8, 21)}:{rng.randint(0, 59):02d}",
        "date": f"2026-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d}",
    }
    if referenceKind is not None and "{id}" in template:
        values["id"] = randomCode(rng, referenceKind, used)
    # Case augmentation changes surrounding language, never the actual code.
    if split == "train" and rng.random() < 0.15:
        template = template.upper()
        for name in values:
            template = template.replace("{" + name.upper() + "}", "{" + name + "}")
    text = template.format(**values)
    if rng.random() < 0.3:
        text = (
            rng.choice(("[", ""))
            + values["brand"]
            + rng.choice(("] ", ": ", "\n"))
            + text
        )
    text = normalizeMessage(text)
    start = text.find("<ANSWER>")
    end = -1
    expected = None
    if start >= 0:
        end = text.index("</ANSWER>") - len("<ANSWER>")
        text = text.replace("<ANSWER>", "").replace("</ANSWER>", "")
        expected = normalizeCode(code)
        assert normalizeCode(text[start:end]) == expected
    return {
        "id": f"{split}/{language}/{index}/{kind}/{repeat}",
        "language": language,
        "family": f"{split}/{index}",
        "kind": kind if expected is not None else "noCode",
        "text": text,
        "code": expected,
        "start": start,
        "end": end,
    }


def buildDatasets() -> dict[str, list[Example]]:
    templates = readTemplates()
    used: set[str] = set()
    result = {}
    for splitIndex, split in enumerate(SPLITS):
        rng = random.Random(CONFIG["seed"] + splitIndex)
        examples = []
        for language in CONFIG["languages"]:
            for index, template in enumerate(templates[language][split]):
                for kind in CONFIG["codeKinds"]:
                    for repeat in range(CONFIG["examplesPerTemplateAndKind"][split]):
                        examples.append(
                            renderExample(
                                template,
                                language,
                                split,
                                index,
                                kind,
                                repeat,
                                rng,
                                used,
                            )
                        )
        rng.shuffle(examples)
        result[split] = examples
    # Append enrichment after generating all three base splits. Their RNG state
    # and reserved codes stay identical across experiments; validation/test are
    # byte-for-byte unchanged when training examples are added.
    additions = json.loads((ROOT / "data/trainingAdditions.json").read_text())
    assert set(additions) == set(CONFIG["languages"])
    rng = random.Random(CONFIG["seed"] + 100)
    for language in CONFIG["languages"]:
        heldOut = set(templates[language]["validation"] + templates[language]["test"])
        assert not heldOut & set(additions[language])
        for index, template in enumerate(additions[language], start=100):
            for kind in CONFIG["codeKinds"]:
                for repeat in range(CONFIG["examplesPerTemplateAndKind"]["train"]):
                    result["train"].append(
                        renderExample(
                            template, language, "train", index, kind, repeat, rng, used
                        )
                    )
    rng.shuffle(result["train"])
    return result


def saveDatasets() -> dict[str, dict[str, int | str]]:
    directory = ROOT / "data/generated"
    directory.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for split, examples in buildDatasets().items():
        data = "".join(
            json.dumps(example, ensure_ascii=False) + "\n" for example in examples
        )
        (directory / f"{split}.jsonl").write_text(data)
        manifest[split] = {
            "examples": len(examples),
            "sha256": hashlib.sha256(data.encode()).hexdigest(),
        }
    (directory / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


def readSplit(split: str, directory: Path = ROOT / "data/generated") -> list[Example]:
    if split not in SPLITS:
        raise ValueError(split)
    return [
        json.loads(line)
        for line in (directory / f"{split}.jsonl").read_text().splitlines()
    ]


if __name__ == "__main__":
    print(json.dumps(saveDatasets(), indent=2))
