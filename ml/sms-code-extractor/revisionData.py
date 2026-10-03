"""Generate the broader v3 corpus and freeze its new evaluation split before training.

The previous test influenced the choice of training categories, so it is now a
development diagnostic. New test families are authored independently of model
predictions and held out across every translation. All text is synthetic.
"""

import argparse
import hashlib
import json
import random
from datetime import datetime, timezone

from smsData import (
    CONFIG,
    ROOT,
    SPLITS,
    Example,
    buildDatasets,
    readTemplates,
    renderExample,
)

REVISION = json.loads((ROOT / "experimentV3.json").read_text())
DIRECTORY = ROOT / "data/generated/v3"
BRANDS = {
    "train": ("Paloma", "Juniper", "Estra", "Vireo", "Arden"),
    "validation": ("Sorrel", "Tavora", "Mistral"),
    "test": ("Oriole", "Caldera", "Selva"),
}


def readLanguageFiles(directory: str) -> dict:
    result = {}
    for path in sorted((ROOT / directory).glob("*.json")):
        entries = json.loads(path.read_text())
        assert not result.keys() & entries.keys(), path
        result.update(entries)
    assert set(result) == set(CONFIG["languages"]), "Missing or extra languages"
    return result


def readRevisionTemplates() -> dict:
    result = readLanguageFiles("data/v3")
    for language, groups in result.items():
        seen = set()
        for split, count in (
            ("train", 16),
            ("validation", 12),
            ("test", 16),
            ("noise", 4),
        ):
            assert len(groups[split]) == count, (language, split)
            assert not seen & set(groups[split]), (language, split, "template leakage")
            seen.update(groups[split])
        for split in SPLITS:
            assert (
                sum("{code}" in text for text in groups[split])
                == len(groups[split]) // 2
            )
    return result


def readRefinements() -> dict:
    result = readLanguageFiles("data/v3-refinements")
    for language, groups in result.items():
        assert len(groups["train"]) == 8, language
        assert sum("{code}" in text for text in groups["train"]) == 4, language
        assert len(groups["noise"]) == 2, language
    return result


def readParaphrases() -> dict:
    result = readLanguageFiles("data/v3-more-paraphrases")
    for language, templates in result.items():
        assert len(templates) == len(set(templates)) == 16, language
        assert sum("{code}" in text for text in templates) == 8, language
    return result


def readMatchedPairs() -> dict:
    result = readLanguageFiles("data/v3-matched-pairs")
    for language, templates in result.items():
        assert len(templates) == len(set(templates)) == 8, language
        assert all("{code}" in text for text in templates[:4]), language
        assert all(
            "{code}" not in text and "{other}" in text for text in templates[4:]
        ), language
    return result


def readTargetedRefinements() -> dict:
    result = json.loads((ROOT / "data/v3TargetedRefinements.json").read_text())
    assert set(result) <= set(CONFIG["languages"])
    for language, templates in result.items():
        assert len(templates) == len(set(templates)) == 8, language
        assert all("{code}" in text for text in templates[:4]), language
        assert all(
            "{code}" not in text and "{other}" in text for text in templates[4:]
        ), language
    return result


def buildRevisionDatasets(
    enriched: bool = False,
    contrastive: bool = False,
    moreParaphrases: bool = False,
    matchedPairs: bool = False,
    targetedRefinements: bool = False,
) -> dict[str, list[Example]]:
    if contrastive and not enriched:
        raise ValueError(
            "Contrastive composition requires the enriched training families"
        )
    if moreParaphrases and not contrastive:
        raise ValueError("Additional paraphrases require contrastive composition")
    if matchedPairs and not moreParaphrases:
        raise ValueError(
            "Matched-pair training includes previous paraphrases for replay"
        )
    if targetedRefinements and not matchedPairs:
        raise ValueError("Targeted refinements require multilingual replay")
    templates = readRevisionTemplates()
    refinements = readRefinements() if enriched else {}
    paraphrases = readParaphrases() if moreParaphrases else {}
    pairs = readMatchedPairs() if matchedPairs else {}
    targeted = readTargetedRefinements() if targetedRefinements else {}
    accountNoise = json.loads((ROOT / "data/accountNoise.json").read_text())
    assert set(accountNoise) == set(CONFIG["languages"])
    oldTemplates = readTemplates()
    oldAdditions = json.loads((ROOT / "data/trainingAdditions.json").read_text())
    # The warm-start model has seen old training codes. Reserve all old positive
    # values so the new test cannot reuse one of them, including by coincidence.
    used = {
        example["code"]
        for examples in buildDatasets().values()
        for example in examples
        if example["code"] is not None
    }
    result = {}
    # Generate test and validation FIRST with independent RNGs. Adding training
    # examples later cannot change either evaluation file or its code values.
    for split in ("test", "validation", "train"):
        rng = random.Random(REVISION["seed"] + SPLITS.index(split))
        examples = []
        for language in CONFIG["languages"]:
            families = list(enumerate(templates[language][split]))
            if split == "train":
                families += list(enumerate(oldTemplates[language]["train"], start=100))
                families += list(enumerate(oldAdditions[language], start=200))
                if enriched:
                    # Old v2 evaluation is now development material. Only the
                    # newly frozen v3 test remains an untouched evaluation.
                    families += list(
                        enumerate(oldTemplates[language]["validation"], start=300)
                    )
                    families += list(
                        enumerate(oldTemplates[language]["test"], start=400)
                    )
                    families += list(
                        enumerate(refinements[language]["train"], start=500)
                    )
                if moreParaphrases:
                    families += list(enumerate(paraphrases[language], start=600))
                if matchedPairs:
                    families += list(enumerate(pairs[language], start=700))
                if targetedRefinements:
                    families += list(enumerate(targeted.get(language, []), start=800))
            repeats = REVISION["examplesPerTemplateAndKind"][split]
            if enriched and split == "train":
                repeats = 4
            if moreParaphrases and split == "train":
                repeats = 3
            noise = templates[language]["noise"]
            if enriched and split == "train":
                noise = noise + refinements[language]["noise"]
            for index, template in families:
                familyRepeats = repeats
                if matchedPairs and split == "train":
                    familyRepeats = 12 if index >= 700 else 1
                if targetedRefinements and split == "train":
                    if index >= 800:
                        familyRepeats = 10
                    elif index >= 700:
                        familyRepeats = 3
                    else:
                        familyRepeats = 1
                for kind in CONFIG["codeKinds"]:
                    for repeat in range(familyRepeats):
                        text = template
                        if contrastive and split == "train":
                            # Account/access vocabulary is deliberately independent
                            # of the label. Mix in only locally scoped distractors;
                            # a global "this SMS has no code" would contradict a
                            # positive main clause and corrupt its supervision.
                            chunks = [text]
                            if rng.random() < 0.8:
                                chunks.append(rng.choice(accountNoise[language]))
                            if rng.random() < 0.6:
                                safeDistractors = [
                                    value
                                    for family, value in families
                                    if family
                                    in (
                                        9,
                                        10,
                                        14,
                                        504,
                                        505,
                                        608,
                                        609,
                                        610,
                                        614,
                                        704,
                                        705,
                                        706,
                                        707,
                                    )
                                ]
                                chunks.append(rng.choice(safeDistractors))
                            if rng.random() < 0.3:
                                chunks.append(rng.choice(noise))
                            rng.shuffle(chunks)
                            text = rng.choice((" ", "\n", "\n\n")).join(chunks)
                        elif (
                            split == "train"
                            and rng.random() < REVISION["trainCompositionProbability"]
                        ):
                            # Safe distractor clauses have no current valid code.
                            # Vary order and spacing; keep the answer span exact.
                            chunks = [
                                text,
                                *rng.sample(noise, rng.choice((1, 2))),
                            ]
                            rng.shuffle(chunks)
                            text = rng.choice((" ", "\n", "\n\n")).join(chunks)
                        example = renderExample(
                            text,
                            language,
                            split,
                            index,
                            kind,
                            repeat,
                            rng,
                            used,
                            brands=BRANDS[split],
                            reserveOnlyUsed=True,
                            referenceKind=kind,
                        )
                        example["id"] = "v3/" + example["id"]
                        example["family"] = "v3/" + example["family"]
                        examples.append(example)
        rng.shuffle(examples)
        result[split] = examples
    return result


def saveRevisionDatasets(
    enriched: bool = False,
    contrastive: bool = False,
    moreParaphrases: bool = False,
    matchedPairs: bool = False,
    targetedRefinements: bool = False,
) -> dict:
    datasets = buildRevisionDatasets(
        enriched, contrastive, moreParaphrases, matchedPairs, targetedRefinements
    )
    encoded = {
        split: "".join(
            json.dumps(example, ensure_ascii=False) + "\n" for example in examples
        )
        for split, examples in datasets.items()
    }
    manifest = {
        split: {
            "examples": len(datasets[split]),
            "sha256": hashlib.sha256(value.encode()).hexdigest(),
        }
        for split, value in encoded.items()
    }
    freezePath = ROOT / "data/v3Freeze.json"
    evaluation = {split: manifest[split] for split in ("validation", "test")}
    if freezePath.exists():
        frozen = json.loads(freezePath.read_text())
        if frozen["evaluation"] != evaluation:
            raise ValueError(
                "Frozen v3 evaluation changed; do not overwrite or silently replace it"
            )
    else:
        freezePath.write_text(
            json.dumps(
                {
                    "frozenAtUtc": datetime.now(timezone.utc).isoformat(),
                    "revision": "v3",
                    "evaluation": evaluation,
                    "policy": REVISION["selectionPolicy"],
                    "initialTemplateHashes": {
                        str(path.relative_to(ROOT)): hashlib.sha256(
                            path.read_bytes()
                        ).hexdigest()
                        for path in sorted((ROOT / "data/v3").glob("*.json"))
                    },
                },
                indent=2,
            )
            + "\n"
        )
    directory = ROOT / "data/generated/v3-enriched" if enriched else DIRECTORY
    if contrastive:
        directory = ROOT / "data/generated/v3-contrastive"
    if moreParaphrases:
        directory = ROOT / "data/generated/v3-paraphrases"
    if matchedPairs:
        directory = ROOT / "data/generated/v3-matched-pairs"
    if targetedRefinements:
        directory = ROOT / "data/generated/v3-targeted"
    directory.mkdir(parents=True, exist_ok=True)
    for split, value in encoded.items():
        (directory / f"{split}.jsonl").write_text(value)
    (directory / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--enriched", action="store_true")
    parser.add_argument("--contrastive", action="store_true")
    parser.add_argument("--more-paraphrases", action="store_true")
    parser.add_argument("--matched-pairs", action="store_true")
    parser.add_argument("--targeted-refinements", action="store_true")
    args = parser.parse_args()
    print(
        json.dumps(
            saveRevisionDatasets(
                args.enriched,
                args.contrastive,
                args.more_paraphrases,
                args.matched_pairs,
                args.targeted_refinements,
            ),
            indent=2,
        )
    )
