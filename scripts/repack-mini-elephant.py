#!/usr/bin/env python3
"""Repack mini-elephant sprites into isolated 256px cells without redrawing art."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--runtime")
    parser.add_argument("--frame-patch", action="append", default=[], metavar="ROW,COL,PNG")
    parser.add_argument("--columns", type=int, default=6)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--padding", type=int, default=12)
    args = parser.parse_args()

    source_path, output_path = Path(args.source), Path(args.output)
    image = Image.open(source_path).convert("RGBA")
    array = np.array(image)
    cell_w, cell_h = image.width // args.columns, image.height // args.rows
    binary = (array[:, :, 3] > 20).astype("uint8")
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, 8)
    groups: dict[tuple[int, int], list[int]] = {(row, col): [] for row in range(args.rows) for col in range(args.columns)}
    for label in range(1, count):
        if int(stats[label, cv2.CC_STAT_AREA]) < 8:
            continue
        cx, cy = centroids[label]
        col = clamp(round((cx - cell_w / 2) / cell_w), 0, args.columns - 1)
        row = clamp(round((cy - cell_h / 2) / cell_h), 0, args.rows - 1)
        groups[(row, col)].append(label)

    boxes: dict[tuple[int, int], tuple[int, int, int, int]] = {}
    for key, members in groups.items():
        if not members:
            raise ValueError(f"no sprite components assigned to cell {key}")
        xs = [int(stats[label, cv2.CC_STAT_LEFT]) for label in members]
        ys = [int(stats[label, cv2.CC_STAT_TOP]) for label in members]
        rights = [int(stats[label, cv2.CC_STAT_LEFT] + stats[label, cv2.CC_STAT_WIDTH]) for label in members]
        bottoms = [int(stats[label, cv2.CC_STAT_TOP] + stats[label, cv2.CC_STAT_HEIGHT]) for label in members]
        boxes[key] = (min(xs), min(ys), max(rights), max(bottoms))

    available_w, available_h = cell_w - args.padding * 2, cell_h - args.padding * 2
    row_scales = []
    for row in range(args.rows):
        max_width = max(boxes[(row, col)][2] - boxes[(row, col)][0] for col in range(args.columns))
        max_height = max(boxes[(row, col)][3] - boxes[(row, col)][1] for col in range(args.columns))
        row_scales.append(min(1.0, available_w / max_width, available_h / max_height))

    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    frame_boxes = []
    for row in range(args.rows):
        row_boxes = []
        for col in range(args.columns):
            members, (left, top, right, bottom) = groups[(row, col)], boxes[(row, col)]
            member_mask = np.isin(labels[top:bottom, left:right], members)
            crop = array[top:bottom, left:right].copy()
            crop[~member_mask] = 0
            sprite = Image.fromarray(crop)
            width = max(1, round(sprite.width * row_scales[row]))
            height = max(1, round(sprite.height * row_scales[row]))
            sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
            local_left = round((left - col * cell_w) * row_scales[row])
            x = clamp(local_left, args.padding, cell_w - args.padding - width)
            y = cell_h - args.padding - height
            output.alpha_composite(sprite, (col * cell_w + x, row * cell_h + y))
            row_boxes.append([x, y, width, height])
        frame_boxes.append(row_boxes)

    for specification in args.frame_patch:
        row_text, col_text, patch_text = specification.split(",", 2)
        row, col = int(row_text), int(col_text)
        if not (0 <= row < args.rows and 0 <= col < args.columns):
            raise ValueError(f"frame patch outside sprite grid: {specification}")
        patch = Image.open(patch_text).convert("RGBA")
        if patch.size != (cell_w, cell_h):
            raise ValueError(f"frame patch must be {cell_w}x{cell_h}: {patch_text}")
        destination = (col * cell_w, row * cell_h)
        output.paste((0, 0, 0, 0), (*destination, destination[0] + cell_w, destination[1] + cell_h))
        output.alpha_composite(patch, destination)
        alpha_box = patch.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"frame patch is empty: {patch_text}")
        left, top, right, bottom = alpha_box
        if left < args.padding or top < args.padding or right > cell_w - args.padding or bottom > cell_h - args.padding:
            raise ValueError(f"frame patch violates {args.padding}px gutter: {patch_text}")
        frame_boxes[row][col] = [left, top, right - left, bottom - top]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path)
    metadata = {
        "source": source_path.as_posix(),
        "output": output_path.as_posix(),
        "grid": {"columns": args.columns, "rows": args.rows, "cellWidth": cell_w, "cellHeight": cell_h},
        "padding": args.padding,
        "rowScales": row_scales,
        "bottoms": [[cell_h - args.padding] * args.columns for _ in range(args.rows)],
        "frames": frame_boxes,
        "framePatches": args.frame_patch,
    }
    metadata_path = Path(args.metadata)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    if args.runtime:
        runtime_path = Path(args.runtime)
        runtime_path.write_text("window.MINI_ELEPHANT_MANIFEST = " + json.dumps(metadata, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({"output": str(output_path), "metadata": str(metadata_path), "rowScales": row_scales}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
