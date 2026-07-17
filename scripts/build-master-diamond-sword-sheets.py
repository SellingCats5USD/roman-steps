#!/usr/bin/env python3
"""Build a layered, pose-aligned master diamond sword equipment set."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
CELL = 256
OUTPUT_CELL = 512
PAD_X = (OUTPUT_CELL - CELL) // 2
COLS = 6
ROWS = 4

# Regions containing the regular diamond weapon. They are used only to derive
# the one-handed trajectory and remove that weapon from the reusable body.
WEAPON_ROIS = {
    (0, 0): (90, 160, 100, 75), (0, 1): (80, 160, 100, 80),
    (0, 2): (75, 160, 100, 75), (0, 3): (75, 160, 100, 75),
    (0, 4): (70, 160, 105, 75), (0, 5): (45, 160, 110, 75),
    (1, 0): (75, 145, 105, 80), (1, 1): (30, 55, 110, 55),
    (1, 2): (150, 85, 106, 70), (1, 3): (150, 85, 106, 70),
    (1, 4): (150, 85, 106, 70), (1, 5): (70, 145, 100, 75),
}

# Walk and wind-up keep the weapon behind the torso. The thrust and recovery
# pass in front, with a small hand patch restored last in every frame.
EXPECTED_GRIPS = {
    (0, 0): (103.0, 193.0), (0, 1): (85.0, 194.0), (0, 2): (80.0, 195.0),
    (0, 3): (80.0, 195.0), (0, 4): (76.0, 195.0), (0, 5): (70.0, 195.0),
    (1, 0): (104.0, 188.0), (1, 1): (95.0, 82.0), (1, 2): (186.0, 117.0),
    (1, 3): (188.0, 118.0), (1, 4): (188.0, 120.0), (1, 5): (88.0, 183.0),
}
Z_ORDER = {
    (0, frame): "background" for frame in range(COLS)
} | {
    (1, 0): "background",
    (1, 1): "background",
    (1, 2): "foreground",
    (1, 3): "foreground",
    (1, 4): "foreground",
    (1, 5): "foreground",
}


def blue_mask(cell: Image.Image, roi: tuple[int, int, int, int]) -> Image.Image:
    x0, y0, width, height = roi
    mask = Image.new("L", (CELL, CELL), 0)
    pixels = cell.load()
    out = mask.load()
    for y in range(y0, min(CELL, y0 + height)):
        for x in range(x0, min(CELL, x0 + width)):
            r, g, b, a = pixels[x, y]
            if a and b > 62 and b > r * 1.20 and b > g * 1.08:
                out[x, y] = 255
    return mask


def trajectory(mask: Image.Image, expected_grip: tuple[float, float]) -> tuple[tuple[float, float], tuple[float, float], float]:
    points = [(x, y) for y in range(CELL) for x in range(CELL) if mask.getpixel((x, y))]
    if len(points) < 12:
        raise ValueError("diamond weapon mask has too few pixels")
    mx = sum(x for x, _ in points) / len(points)
    my = sum(y for _, y in points) / len(points)
    xx = sum((x - mx) ** 2 for x, _ in points)
    yy = sum((y - my) ** 2 for _, y in points)
    xy = sum((x - mx) * (y - my) for x, y in points)
    angle = 0.5 * math.atan2(2 * xy, xx - yy)
    axis = (math.cos(angle), math.sin(angle))
    projected = [((x - mx) * axis[0] + (y - my) * axis[1], x, y) for x, y in points]
    low = min(projected)
    high = max(projected)
    endpoint_a = (float(low[1]), float(low[2]))
    endpoint_b = (float(high[1]), float(high[2]))
    base, tip = (endpoint_a, endpoint_b) if math.dist(endpoint_a, expected_grip) < math.dist(endpoint_b, expected_grip) else (endpoint_b, endpoint_a)
    vx, vy = tip[0] - base[0], tip[1] - base[1]
    length = max(1.0, math.hypot(vx, vy))
    unit = (vx / length, vy / length)
    grip = (base[0] - unit[0] * 10, base[1] - unit[1] * 10)
    return grip, unit, length
def distance_to_edge(point: tuple[float, float], vector: tuple[float, float]) -> float:
    distances = []
    for coordinate, direction, limit in zip(point, vector, (OUTPUT_CELL, CELL)):
        if direction > 1e-6:
            distances.append((limit - 8 - coordinate) / direction)
        elif direction < -1e-6:
            distances.append((8 - coordinate) / direction)
    return max(1.0, min(value for value in distances if value > 0))


def remove_weapon(cell: Image.Image, mask: Image.Image, grip: tuple[float, float], unit: tuple[float, float], length: float) -> Image.Image:
    removal = mask.filter(ImageFilter.MaxFilter(7))
    draw = ImageDraw.Draw(removal)
    tip = (grip[0] + unit[0] * (length + 10), grip[1] + unit[1] * (length + 10))
    draw.line([grip, tip], fill=255, width=13)
    gx, gy = grip
    draw.ellipse((gx - 14, gy - 14, gx + 14, gy + 14), fill=255)
    alpha = cell.getchannel("A")
    alpha.paste(0, mask=removal)
    cell.putalpha(alpha)
    return removal


def remove_left_boundary_overflow(cell: Image.Image) -> None:
    """Remove weapon fragments wrapped in from the preceding source cell."""
    alpha = cell.getchannel("A")
    pixels = alpha.load()
    pending = [(0, y) for y in range(CELL) if pixels[0, y]]
    seen = set(pending)
    while pending:
        x, y = pending.pop()
        pixels[x, y] = 0
        for nx in range(max(0, x - 1), min(CELL, x + 2)):
            for ny in range(max(0, y - 1), min(CELL, y + 2)):
                if pixels[nx, ny] and (nx, ny) not in seen:
                    seen.add((nx, ny))
                    pending.append((nx, ny))
    cell.putalpha(alpha)


def make_weapon_layer(master: Image.Image, grip: tuple[float, float], unit: tuple[float, float], old_length: float) -> Image.Image:
    grip = (grip[0] + PAD_X, grip[1])
    available = distance_to_edge(grip, unit)
    full_height = min(210.0, max(145.0, old_length * 2.05), available / 0.78)
    full_height = max(120.0, full_height)
    full_width = max(34, round(full_height * 0.36))
    size = (full_width, round(full_height))
    sword = master.resize(size, Image.Resampling.LANCZOS)
    grip_in_sword = (size[0] // 2, round(size[1] * 0.82))
    layer = Image.new("RGBA", (OUTPUT_CELL, CELL), (0, 0, 0, 0))
    layer.alpha_composite(sword, (round(grip[0] - grip_in_sword[0]), round(grip[1] - grip_in_sword[1])))
    rotation = math.degrees(math.atan2(-unit[0], -unit[1]))
    return layer.rotate(rotation, resample=Image.Resampling.BICUBIC, center=grip)


def make_interaction_patch(original: Image.Image, grip: tuple[float, float], row: int) -> tuple[Image.Image, list[int]]:
    width, height = (30, 28) if row == 0 else (34, 30)
    x0 = max(0, min(CELL - width, round(grip[0] - width / 2)))
    y0 = max(0, min(CELL - height, round(grip[1] - height / 2)))
    patch = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    crop = original.crop((x0, y0, x0 + width, y0 + height))
    pixels = crop.load()
    keep = Image.new("L", crop.size, 0)
    keep_pixels = keep.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            skin_or_leather = a and r > 58 and r > b * 1.18 and (r > g * 0.88 or g < 95)
            if skin_or_leather:
                keep_pixels[x, y] = 255
    keep = keep.filter(ImageFilter.MaxFilter(3))
    crop.putalpha(Image.composite(crop.getchannel("A"), Image.new("L", crop.size, 0), keep))
    patch.alpha_composite(crop, (x0, y0))
    return patch, [x0, y0, width, height]


def compose_cell(body: Image.Image, weapon: Image.Image, interaction: Image.Image, z_order: str) -> Image.Image:
    padded_body = Image.new("RGBA", (OUTPUT_CELL, CELL), (0, 0, 0, 0))
    padded_body.alpha_composite(body, (PAD_X, 0))
    padded_interaction = Image.new("RGBA", (OUTPUT_CELL, CELL), (0, 0, 0, 0))
    padded_interaction.alpha_composite(interaction, (PAD_X, 0))
    result = Image.new("RGBA", (OUTPUT_CELL, CELL), (0, 0, 0, 0))
    if z_order == "background":
        result.alpha_composite(weapon)
        result.alpha_composite(padded_body)
    else:
        result.alpha_composite(padded_body)
        result.alpha_composite(weapon)
    result.alpha_composite(padded_interaction)
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", default="assets/characters/roman/weapons/master/master-build.json")
    args = parser.parse_args()

    master = Image.open(ROOT / "assets/master-diamond-sword-v1.png").convert("RGBA")
    master = master.crop(master.getchannel("A").getbbox())
    weapon_sheet = Image.new("RGBA", (COLS * OUTPUT_CELL, ROWS * CELL), (0, 0, 0, 0))
    metadata: dict[str, object] = {"version": 2, "sourceGrid": [COLS, ROWS, CELL, CELL], "grid": [COLS, ROWS, OUTPUT_CELL, CELL], "framePaddingX": PAD_X, "poses": []}

    armor_data = {}
    for armor in ("bronze", "silver"):
        suffix = "-silver" if armor == "silver" else ""
        canonical = Image.open(ROOT / f"assets/hero-roman{suffix}-v1.png" if armor == "silver" else ROOT / "assets/hero-roman-v4.png").convert("RGBA")
        diamond = Image.open(ROOT / f"assets/hero-roman{suffix}-diamond-v1.png").convert("RGBA")
        body_sheet = Image.new("RGBA", (COLS * OUTPUT_CELL, ROWS * CELL), (0, 0, 0, 0))
        interaction_sheet = Image.new("RGBA", body_sheet.size, (0, 0, 0, 0))
        assembled = Image.new("RGBA", body_sheet.size, (0, 0, 0, 0))
        for row in range(ROWS):
            for frame in range(COLS):
                box = (frame * CELL, row * CELL, (frame + 1) * CELL, (row + 1) * CELL)
                assembled.alpha_composite(canonical.crop(box), (frame * OUTPUT_CELL + PAD_X, row * CELL))
        armor_data[armor] = (canonical, diamond, body_sheet, interaction_sheet, assembled)

    pose_cache = {}
    bronze_diamond = armor_data["bronze"][1]
    for row in (0, 1):
        for frame in range(COLS):
            box = (frame * CELL, row * CELL, (frame + 1) * CELL, (row + 1) * CELL)
            guide = bronze_diamond.crop(box)
            mask = blue_mask(guide, WEAPON_ROIS[(row, frame)])
            grip, unit, old_length = trajectory(mask, EXPECTED_GRIPS[(row, frame)])
            weapon = make_weapon_layer(master, grip, unit, old_length)
            weapon_sheet.alpha_composite(weapon, (frame * OUTPUT_CELL, row * CELL))
            pose_cache[(row, frame)] = (grip, unit, old_length, weapon)
            metadata["poses"].append({
                "row": row,
                "frame": frame,
                "grip": [round(grip[0], 2), round(grip[1], 2)],
                "direction": [round(unit[0], 4), round(unit[1], 4)],
                "sourceBladeLength": round(old_length, 2),
                "zOrder": Z_ORDER[(row, frame)],
            })

    interaction_rects = {"bronze": [], "silver": []}
    for armor, (canonical, diamond, body_sheet, interaction_sheet, assembled) in armor_data.items():
        for row in (0, 1):
            for frame in range(COLS):
                box = (frame * CELL, row * CELL, (frame + 1) * CELL, (row + 1) * CELL)
                original = diamond.crop(box)
                body = original.copy()
                remove_left_boundary_overflow(body)
                guide = bronze_diamond.crop(box)
                mask = blue_mask(guide, WEAPON_ROIS[(row, frame)])
                grip, unit, old_length, weapon = pose_cache[(row, frame)]
                remove_weapon(body, mask, grip, unit, old_length)
                interaction, rect = make_interaction_patch(original, grip, row)
                body_sheet.alpha_composite(body, (frame * OUTPUT_CELL + PAD_X, row * CELL))
                interaction_sheet.alpha_composite(interaction, (frame * OUTPUT_CELL + PAD_X, row * CELL))
                cell = compose_cell(body, weapon, interaction, Z_ORDER[(row, frame)])
                assembled.paste((0, 0, 0, 0), (frame * OUTPUT_CELL, row * CELL, (frame + 1) * OUTPUT_CELL, (row + 1) * CELL))
                assembled.alpha_composite(cell, (frame * OUTPUT_CELL, row * CELL))
                interaction_rects[armor].append({"row": row, "frame": frame, "rect": rect, "reason": "restore grip hand above ornate guard"})

        body_path = ROOT / f"assets/characters/roman/body/{armor}-deweaponed.png"
        interaction_path = ROOT / f"assets/characters/roman/interaction_patches/{armor}-master-hands.png"
        output_path = ROOT / f"assets/characters/roman/assembled/{armor}-master.png"
        body_path.parent.mkdir(parents=True, exist_ok=True)
        interaction_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        body_sheet.save(body_path)
        interaction_sheet.save(interaction_path)
        assembled.save(output_path)
        print(output_path)

    weapon_path = ROOT / "assets/characters/roman/weapons/master/master-weapon-layer.png"
    weapon_path.parent.mkdir(parents=True, exist_ok=True)
    weapon_sheet.save(weapon_path)
    metadata["interactionPatches"] = interaction_rects
    metadata_path = ROOT / args.metadata
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(weapon_path)
    print(metadata_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
