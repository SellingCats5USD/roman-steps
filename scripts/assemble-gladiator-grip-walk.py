#!/usr/bin/env python3
"""Build a corrected two-pose gladiator carry loop into the existing grid."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


CELL_W, WALK_H = 256, 341


def alpha_box(image: Image.Image) -> tuple[int, int, int, int]:
    box = image.getchannel("A").getbbox()
    if box is None:
        raise ValueError("sprite is empty")
    return box


def normalize(source: Image.Image, target_box: tuple[int, int, int, int]) -> Image.Image:
    box = alpha_box(source)
    sprite = source.crop(box)
    tx0, ty0, tx1, ty1 = target_box
    scale = min((tx1 - tx0) / sprite.width, (ty1 - ty0) / sprite.height)
    size = (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale)))
    sprite = sprite.resize(size, Image.Resampling.LANCZOS)
    cell = Image.new("RGBA", (CELL_W, WALK_H))
    x = round((tx0 + tx1 - size[0]) / 2)
    y = ty1 - size[1]
    cell.alpha_composite(sprite, (x, y))
    return cell


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--pose-a", required=True)
    parser.add_argument("--pose-b", required=True)
    parser.add_argument("--metadata", required=True)
    args = parser.parse_args()

    original = Image.open(args.source).convert("RGBA")
    if original.size != (1536, 1024):
        raise ValueError("expected the canonical 1536x1024 gladiator sheet")
    output = original.copy()
    poses = [Image.open(args.pose_a).convert("RGBA"), Image.open(args.pose_b).convert("RGBA")]
    replacements = []
    for frame in range(6):
        target = original.crop((frame * CELL_W, 0, (frame + 1) * CELL_W, WALK_H))
        replacement = normalize(poses[frame % 2], alpha_box(target))
        output.paste((0, 0, 0, 0), (frame * CELL_W, 0, (frame + 1) * CELL_W, WALK_H))
        output.alpha_composite(replacement, (frame * CELL_W, 0))
        replacements.append({"row": 0, "frame": frame, "pose": "carry_a" if frame % 2 == 0 else "carry_b"})
    output.save(args.output)
    metadata = {
        "source": args.source,
        "output": args.output,
        "decisionLevel": 3,
        "motions": {"walk": {"row": 0, "poseFamily": "trident_and_shield_carry"}, "attack": {"row": 1, "source": "canonical unchanged"}, "block": {"row": 2, "source": "canonical unchanged"}},
        "replacements": replacements,
        "invariant": "Rows 1 and 2 are copied unchanged from the canonical gladiator sheet.",
    }
    Path(args.metadata).write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata))


if __name__ == "__main__":
    main()
