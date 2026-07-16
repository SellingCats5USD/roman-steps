#!/usr/bin/env python3
"""Re-anchor only the walk-cycle trident to the gladiator's free hand."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

CELL_W = 256
WALK_H = 341


def old_trident_mask(frame: np.ndarray) -> np.ndarray:
    """Remove only exposed trident pieces; never touch shield decoration."""
    h, w = frame.shape[:2]
    y, x = np.mgrid[:h, :w]
    shaft_x = 208 - 0.288 * (y - 84)
    alpha = frame[:, :, 3] > 20
    exposed_tines = (y >= 22) & (y < 124) & (x > 178) & alpha
    exposed_tail = (y >= 260) & (np.abs(x - shaft_x) <= 5) & alpha
    return exposed_tines | exposed_tail


def compose(frame: np.ndarray, mask: np.ndarray, shift_x: int) -> np.ndarray:
    """Place a re-anchored trident behind the unchanged body and shield."""
    h, w = frame.shape[:2]
    trident_top = np.zeros_like(frame)
    top_only = mask.copy()
    top_only[124:] = False
    trident_top[top_only] = frame[top_only]
    clean = frame.copy()
    clean[mask] = 0
    moved = np.zeros_like(frame)
    if shift_x < 0:
        moved[:, :shift_x] = trident_top[:, -shift_x:]
    else:
        moved[:, shift_x:] = trident_top[:, :w - shift_x]
    draw = cv2.cvtColor(moved, cv2.COLOR_RGBA2BGRA)
    start = (208 + shift_x, 78)
    end = (round(208 - .288 * (h - 84) + shift_x), h - 4)
    cv2.line(draw, start, end, (45, 38, 33, 255), 8, cv2.LINE_AA)
    cv2.line(draw, start, end, (49, 87, 128, 255), 4, cv2.LINE_AA)
    base = Image.fromarray(cv2.cvtColor(draw, cv2.COLOR_BGRA2RGBA))
    base.alpha_composite(Image.fromarray(clean))
    return np.array(base)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--shift-x", type=int, default=-48)
    parser.add_argument("--frames", type=int, default=6)
    args = parser.parse_args()

    source = np.array(Image.open(args.source).convert("RGBA"))
    output = source.copy()
    operations = []
    for col in range(args.frames):
        left = col * CELL_W
        frame = source[:WALK_H, left:left + CELL_W]
        mask = old_trident_mask(frame)
        output[:WALK_H, left:left + CELL_W] = compose(frame, mask, args.shift_x)
        operations.append({"row": 0, "frame": col, "shiftX": args.shift_x, "maskedPixels": int(mask.sum())})

    if not np.array_equal(output[WALK_H:], source[WALK_H:]):
        raise ValueError("non-walk animation rows changed")
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(output).save(args.output)
    metadata = {
        "source": Path(args.source).as_posix(),
        "output": Path(args.output).as_posix(),
        "grid": {"columns": 6, "rows": 3, "cellWidth": CELL_W, "walkHeight": WALK_H},
        "decisionLevel": 2,
        "reason": "Move the walk-cycle trident behind the free hand; preserve shield and all attack cells.",
        "operations": operations,
    }
    Path(args.metadata).write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
