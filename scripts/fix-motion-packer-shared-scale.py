"""One-time migration: make motion packing preserve scale across every pose."""

from pathlib import Path


path = Path(__file__).with_name("repack-roman-motion-sheet.py")
text = path.read_text(encoding="utf-8")
old = '''    output = Image.new("RGBA", (COLS * CELL, ROWS * CELL))
    frames: list[dict[str, object]] = []

    for row in range(ROWS):
        for column in range(COLS):
            left = column * source_cell_w
            top = row * source_cell_h
            frame = source.crop((left, top, left + source_cell_w, top + source_cell_h))
            bbox = alpha_bbox(frame)
            sprite = frame.crop(bbox)
            scale = min((CELL - GUTTER * 2) / sprite.width, (CELL - GUTTER * 2) / sprite.height)
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
'''
new = '''    output = Image.new("RGBA", (COLS * CELL, ROWS * CELL))
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
'''
if old not in text:
    raise RuntimeError("repacker is not in the expected pre-migration state")
text = text.replace(old, new, 1)
text = text.replace(
    '                "gutter": GUTTER,\n                "frames": frames,',
    '                "gutter": GUTTER,\n                "sharedScale": scale,\n                "frames": frames,',
    1,
)
path.write_text(text, encoding="utf-8")
