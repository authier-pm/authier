"""Fine-tune MiniLM's encoder and span head; select checkpoint on validation only.

Run from any directory with the local venv Python. Use HIP_VISIBLE_DEVICES=0 on
this Radeon workstation to exclude its unsupported integrated GPU.
"""

import argparse
import hashlib
import json
import random
import time
from functools import partial
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader
from transformers import get_linear_schedule_with_warmup

from smsData import CONFIG, ROOT, readSplit, saveDatasets
from smsModel import (
    calibrate,
    collate,
    encodeExamples,
    loadModel,
    loadTokenizer,
    predictTorch,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "artifacts/minilm-v2")
    parser.add_argument("--data-dir", type=Path, help="Pre-generated, versioned corpus")
    parser.add_argument("--config", type=Path, help="Experiment overrides")
    parser.add_argument(
        "--initial-checkpoint",
        type=Path,
        help="Continue fine-tuning an existing checkpoint",
    )
    parser.add_argument("--epochs", type=int)
    parser.add_argument("--batch-size", type=int)
    parser.add_argument(
        "--save-every",
        type=int,
        default=0,
        help="Save recovery state every N steps (0 disables)",
    )
    parser.add_argument(
        "--resume", action="store_true", help="Resume this run's recovery.pt"
    )
    parser.add_argument(
        "--device", default="cuda" if torch.cuda.is_available() else "cpu"
    )
    args = parser.parse_args()
    config = {**CONFIG}
    if args.config:
        config.update(json.loads(args.config.read_text()))
    if args.epochs is None:
        args.epochs = config["epochs"]
    if args.batch_size is None:
        args.batch_size = config["batchSize"]
    if args.epochs < 1 or args.batch_size < 1 or args.save_every < 0:
        raise ValueError("Epochs and batch size must be positive")
    if args.resume and args.save_every == 0:
        raise ValueError("Resume requires --save-every")
    if (args.output / "training.json").exists() and not args.resume:
        raise FileExistsError(f"Existing run: {args.output}. Choose a fresh --output.")
    args.output.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(6)
    random.seed(config["seed"])
    np.random.seed(config["seed"] % (2**32))
    torch.manual_seed(config["seed"])
    device = torch.device(args.device)
    dataDirectory = args.data_dir or ROOT / "data/generated"
    if args.data_dir:
        manifest = json.loads((dataDirectory / "manifest.json").read_text())
        for split in ("train", "validation"):
            digest = hashlib.sha256(
                (dataDirectory / f"{split}.jsonl").read_bytes()
            ).hexdigest()
            if digest != manifest[split]["sha256"]:
                raise ValueError(f"Corpus checksum mismatch: {split}")
    else:
        manifest = saveDatasets()
    initial = args.initial_checkpoint or config["baseModel"]
    tokenizer = loadTokenizer(initial)
    model = loadModel(
        initial,
        presenceHead=config.get("presenceHead", False),
        tokenHead=config.get("tokenHead", False),
    ).to(device)
    model.config.pad_token_id = tokenizer.pad_token_id
    if config["freezeWordEmbeddings"]:
        model.bert.embeddings.word_embeddings.weight.requires_grad = False
    trainable = sum(
        parameter.numel() for parameter in model.parameters() if parameter.requires_grad
    )
    print(
        json.dumps(
            {"device": str(device), "trainableParameters": trainable, "data": manifest}
        ),
        flush=True,
    )
    features = encodeExamples(readSplit("train", dataDirectory), tokenizer)
    validation = readSplit("validation", dataDirectory)
    shuffleGenerator = torch.Generator() if args.save_every else None
    loader = DataLoader(
        features,
        batch_size=args.batch_size,
        shuffle=True,
        collate_fn=partial(collate, tokenizer=tokenizer),
        num_workers=0,
        generator=shuffleGenerator,
    )
    encoder = [
        parameter
        for name, parameter in model.named_parameters()
        if parameter.requires_grad
        and not name.startswith(("qa_outputs", "code_presence", "code_tokens"))
    ]
    head = list(model.qa_outputs.parameters())
    if hasattr(model, "code_presence"):
        head += list(model.code_presence.parameters())
    if hasattr(model, "code_tokens"):
        head += list(model.code_tokens.parameters())
    optimizer = torch.optim.AdamW(
        [
            {"params": encoder, "lr": config["learningRate"]},
            {"params": head, "lr": config["headLearningRate"]},
        ],
        weight_decay=0.01,
    )
    totalSteps = len(loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer, int(totalSteps * config["warmupFraction"]), totalSteps
    )
    started = time.monotonic()
    history = []
    best = -1.0
    step = 0
    firstEpoch = 1
    completedBatches = 0
    resumedLoss = 0.0
    previousSeconds = 0.0
    if args.resume:
        recovery = torch.load(
            args.output / "recovery.pt", map_location="cpu", weights_only=True
        )
        if recovery["config"] != config or recovery["dataset"] != manifest:
            raise ValueError(
                "Recovery config or corpus differs from the interrupted run"
            )
        if (
            recovery["epochs"] != args.epochs
            or recovery["batchSize"] != args.batch_size
        ):
            raise ValueError("Recovery epochs or batch size changed")
        model.load_state_dict(recovery["model"])
        optimizer.load_state_dict(recovery["optimizer"])
        scheduler.load_state_dict(recovery["scheduler"])
        torch.set_rng_state(recovery["torchRng"])
        if device.type == "cuda":
            torch.cuda.set_rng_state_all(recovery["cudaRng"])
        firstEpoch, completedBatches = recovery["epoch"], recovery["completedBatches"]
        history, best, step = recovery["history"], recovery["best"], recovery["step"]
        resumedLoss, previousSeconds = recovery["lossSum"], recovery["elapsedSeconds"]
        del recovery
        print(json.dumps({"resumedEpoch": firstEpoch, "resumedStep": step}), flush=True)

    def elapsed() -> float:
        return previousSeconds + time.monotonic() - started

    def saveRecovery(epoch: int, batches: int, lossSum: float) -> None:
        if not args.save_every:
            return
        temporary = args.output / "recovery.pt.tmp"
        torch.save(
            {
                "config": config,
                "dataset": manifest,
                "epochs": args.epochs,
                "batchSize": args.batch_size,
                "epoch": epoch,
                "completedBatches": batches,
                "model": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler.state_dict(),
                "torchRng": torch.get_rng_state(),
                "cudaRng": torch.cuda.get_rng_state_all()
                if device.type == "cuda"
                else [],
                "history": history,
                "best": best,
                "step": step,
                "lossSum": lossSum,
                "elapsedSeconds": elapsed(),
            },
            temporary,
        )
        temporary.replace(args.output / "recovery.pt")
        print(json.dumps({"recoverySavedAtStep": step}), flush=True)

    # Full FP32 is intentional: avoid unvalidated GPU-specific mixed precision.
    for epoch in range(firstEpoch, args.epochs + 1):
        model.train()
        if shuffleGenerator is not None:
            shuffleGenerator.manual_seed(config["seed"] + epoch)
        lossSum = resumedLoss if epoch == firstEpoch else 0.0
        for batchIndex, batch in enumerate(loader, start=1):
            if epoch == firstEpoch and batchIndex <= completedBatches:
                continue
            optimizer.zero_grad(set_to_none=True)
            loss = model(**{key: value.to(device) for key, value in batch.items()}).loss
            if not torch.isfinite(loss):
                raise FloatingPointError(f"Non-finite loss at step {step}")
            loss.backward()
            torch.nn.utils.clip_grad_norm_(
                [
                    parameter
                    for parameter in model.parameters()
                    if parameter.requires_grad
                ],
                1.0,
            )
            optimizer.step()
            scheduler.step()
            lossSum += float(loss.detach())
            step += 1
            if step % 100 == 0:
                print(
                    json.dumps(
                        {
                            "epoch": epoch,
                            "step": step,
                            "totalSteps": totalSteps,
                            "loss": round(float(loss.detach()), 4),
                            "elapsedSeconds": round(elapsed()),
                        }
                    ),
                    flush=True,
                )
            if args.save_every and step % args.save_every == 0:
                saveRecovery(epoch, batchIndex, lossSum)
        predictions = predictTorch(
            model, tokenizer, validation, args.batch_size, device
        )
        # New runs select weights with joint score/margin calibration. Preserve
        # threshold-only selection when reproducing earlier experiment configs.
        threshold, scores = calibrate(
            validation,
            predictions,
            includeMargin=config.get("selectWithMargin", False),
            targetPrecision=config["validationTargetPrecision"],
        )
        entry = {
            "epoch": epoch,
            "loss": lossSum / len(loader),
            "nullThreshold": threshold,
            "validation": scores,
            "elapsedSeconds": elapsed(),
        }
        history.append(entry)
        print(json.dumps(entry), flush=True)
        if scores["f1"] > best:
            best = scores["f1"]
            model.save_pretrained(args.output / "checkpoint", safe_serialization=True)
            tokenizer.save_pretrained(args.output / "checkpoint")
            confidenceMode = "span-minus-null"
            if config.get("presenceHead"):
                confidenceMode = "presence-logit"
            if config.get("tokenHead"):
                confidenceMode = "token-average-logit"
            (args.output / "decoder.json").write_text(
                json.dumps(
                    {
                        "nullThreshold": threshold,
                        "minimumMargin": scores["minimumMargin"],
                        "epoch": epoch,
                        "maxTokens": CONFIG["maxTokens"],
                        "codeLengths": CONFIG["codeLengths"],
                        "languages": CONFIG["languages"],
                        "caseSensitive": True,
                        "digitRequirement": False,
                        "confidenceMode": confidenceMode,
                    },
                    indent=2,
                )
                + "\n"
            )
        (args.output / "training.json").write_text(
            json.dumps(
                {
                    "config": config,
                    "dataDirectory": str(dataDirectory.resolve()),
                    "initialCheckpoint": str(initial),
                    "epochs": args.epochs,
                    "batchSize": args.batch_size,
                    "recoveryCheckpointEverySteps": args.save_every,
                    "shuffle": "seed + epoch, independent generator"
                    if args.save_every
                    else "global torch RNG",
                    "device": str(device),
                    "hardware": torch.cuda.get_device_name(device)
                    if device.type == "cuda"
                    else "CPU",
                    "torchVersion": torch.__version__,
                    "trainableParameters": trainable,
                    "dataset": manifest,
                    "history": history,
                    "peakGpuBytes": torch.cuda.max_memory_allocated(device)
                    if device.type == "cuda"
                    else 0,
                    "testUsedForSelection": False,
                    "checkpointSelection": "Validation F1 at target precision with joint score/margin calibration"
                    if config.get("selectWithMargin")
                    else "Validation F1 at target precision, null-score threshold only; margin calibrated after weight selection",
                },
                indent=2,
            )
            + "\n"
        )
        saveRecovery(epoch + 1, 0, 0.0)
    print(f"Training complete: {args.output}", flush=True)


if __name__ == "__main__":
    main()
