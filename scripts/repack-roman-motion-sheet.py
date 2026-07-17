"""Pack a generated 6x2 motion board into guarded 256px sprite cells."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


COLS = 6
ROWS = 2
CELL = 256
GUTTER = 10


def alpha_bbox(frame: Image.Image) -> tuple[int, int, int, int]:
    bbox = frame.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("empty generated frame")
    return bbox


def repack(source_path: Path, output_path: Path) -> None:
    source = Image.open(source_path).convert("RGBA")
    if source.width % COLS or source.height % ROWS:
        raise ValueError(f"{source_path}: expected a divisible 6x2 board, got {source.size}")

    source_cell_w = source.width // COLS
    source_cell_h = source.height // ROWS
    output = Image.new("RGBA", (COLS * CELL, ROWS * CELL))
    frames: list[dict[str, object]] = []
    source_frames: list[tuple[int, int, tuple[int, int, int, int], Image.Image]] = []

    for row in range(ROWS):
        for column in range(COLS):
            left = column * source_cell_w
            top = row * source_cell_h
            frame = source.crop((left, top, left + source_cell_w, top + source_cell_h))
            bbox = alpha_bbox(frame)
            source_frames.append((row, column, bbox, frame.crop(bbox)))

    # Preserve one body scale through both jump and vault rows. Per-pose fit-to-cell
    # scaling makes crouches and horizontal vaults balloon relative to upright poses.
    max_width = max(sprite.width for _, _, _, sprite in source_frames)
    max_height = max(sprite.height for _, _, _, sprite in source_frames)
    scale = min((CELL - GUTTER * 2) / max_width, (CELL - GUTTER * 2) / max_height)

    for row, column, bbox, sprite in source_frames:
        width = max(1, round(sprite.width * scale))
        height = max(1, round(sprite.height * scale))
        sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)

        x = column * CELL + (CELL - width) // 2
        y = row * CELL + CELL - GUTTER - height
        output.alpha_composite(sprite, (x, y))
        frames.append(
            {
                "row": row,
                "frame": column,
                "sourceBBox": list(bbox),
                "packedRect": [x - column * CELL, y - row * CELL, width, height],
                "bottom": CELL - GUTTER,
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, optimize=True)
    output_path.with_suffix(".json").write_text(
        json.dumps(
            {
                "grid": {"columns": COLS, "rows": ROWS, "cellWidth": CELL, "cellHeight": CELL},
                "gutter": GUTTER,
                "sharedScale": scale,
                "frames": frames,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    repack(args.input, args.output)


if __name__ == "__main__":
    main()
