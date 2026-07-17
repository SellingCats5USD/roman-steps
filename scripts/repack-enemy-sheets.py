#!/usr/bin/env python3
"""Repack leaking enemy sheets into isolated, padded animation cells."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw


def connected_components(alpha: Image.Image, threshold: int = 8) -> list[dict]:
    width, height = alpha.size
    pixels = alpha.tobytes()
    visited = bytearray(width * height)
    components: list[dict] = []
    for start, value in enumerate(pixels):
        if value < threshold or visited[start]:
            continue
        visited[start] = 1
        pending = [start]
        points: list[int] = []
        left = right = start % width
        top = bottom = start // width
        while pending:
            index = pending.pop()
            points.append(index)
            x, y = index % width, index // width
            left, right = min(left, x), max(right, x)
            top, bottom = min(top, y), max(bottom, y)
            for neighbor in (index - 1, index + 1, index - width, index + width):
                if neighbor < 0 or neighbor >= width * height or visited[neighbor]:
                    continue
                nx, ny = neighbor % width, neighbor // width
                if abs(nx - x) + abs(ny - y) != 1 or pixels[neighbor] < threshold:
                    continue
                visited[neighbor] = 1
                pending.append(neighbor)
        components.append({"points": points, "size": len(points), "bbox": (left, top, right + 1, bottom + 1)})
    return components


def bbox_distance(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    dx = max(a[0] - b[2], b[0] - a[2], 0)
    dy = max(a[1] - b[3], b[1] - a[3], 0)
    return dx * dx + dy * dy


def repack_sprite(root: Path, sprite: dict) -> dict:
    source_path = root / sprite["source"]
    output_path = root / sprite["output"]
    source = Image.open(source_path).convert("RGBA")
    columns, rows = int(sprite["columns"]), int(sprite["rows"])
    padding = int(sprite.get("paddingX", 96))
    logical_width, logical_height = source.width / columns, source.height / rows
    output_cell_width = math.ceil(logical_width) + padding * 2
    output_cell_height = math.ceil(logical_height)
    output = Image.new("RGBA", (columns * output_cell_width, rows * output_cell_height), (0, 0, 0, 0))
    frame_boxes: list[list[list[int]]] = []

    for row_index in range(rows):
        source_top = round(row_index * logical_height)
        source_bottom = round((row_index + 1) * logical_height)
        row_image = source.crop((0, source_top, source.width, source_bottom))
        alpha = row_image.getchannel("A")
        components = connected_components(alpha)
        substantial = [component for component in components if component["size"] >= 100]
        if len(substantial) < columns:
            raise ValueError(f"{source_path}: row {row_index} has only {len(substantial)} pose components")
        mains = sorted(sorted(substantial, key=lambda component: component["size"], reverse=True)[:columns], key=lambda component: component["bbox"][0])
        assignments: list[list[dict]] = [[main] for main in mains]
        main_ids = {id(main) for main in mains}
        for component in components:
            if id(component) in main_ids or component["size"] < 6:
                continue
            nearest = min(range(columns), key=lambda frame: bbox_distance(component["bbox"], mains[frame]["bbox"]))
            if bbox_distance(component["bbox"], mains[nearest]["bbox"]) <= 64 * 64:
                assignments[nearest].append(component)

        row_boxes: list[list[int]] = []
        for frame, assigned in enumerate(assignments):
            left = min(component["bbox"][0] for component in assigned)
            top = min(component["bbox"][1] for component in assigned)
            right = max(component["bbox"][2] for component in assigned)
            bottom = max(component["bbox"][3] for component in assigned)
            mask = Image.new("L", (right - left, bottom - top), 0)
            mask_pixels = mask.load()
            for component in assigned:
                for index in component["points"]:
                    x, y = index % row_image.width, index // row_image.width
                    mask_pixels[x - left, y - top] = 255
            crop = row_image.crop((left, top, right, bottom))
            crop_alpha = Image.composite(crop.getchannel("A"), Image.new("L", crop.size, 0), mask)
            crop.putalpha(crop_alpha)
            source_left = round(frame * logical_width)
            dest_x = frame * output_cell_width + padding + left - source_left
            dest_y = row_index * output_cell_height + top
            if dest_x < frame * output_cell_width or dest_x + crop.width > (frame + 1) * output_cell_width:
                raise ValueError(f"{source_path}: frame {row_index}:{frame} exceeds its padded output cell")
            output.alpha_composite(crop, (dest_x, dest_y))
            row_boxes.append([dest_x - frame * output_cell_width, top, dest_x - frame * output_cell_width + crop.width, bottom])
        frame_boxes.append(row_boxes)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path)
    result = {key: value for key, value in sprite.items() if key not in {"logicalCellWidth", "logicalCellHeight", "outputCellWidth", "outputCellHeight", "frameBoxes"}}
    result.update({"logicalCellWidth": logical_width, "logicalCellHeight": logical_height, "outputCellWidth": output_cell_width, "outputCellHeight": output_cell_height, "frameBoxes": frame_boxes})
    return result


def render_contact_sheet(root: Path, sprites: dict, output_path: Path) -> None:
    panels = []
    for name, sprite in sprites.items():
        image = Image.open(root / sprite["output"]).convert("RGBA")
        panel = Image.new("RGBA", (sprite["columns"] * 180, sprite["rows"] * 180 + 28), "#e6e4d8")
        draw = ImageDraw.Draw(panel)
        draw.rectangle((0, 0, panel.width, 27), fill="#283765")
        draw.text((8, 7), name, fill="#fff8e9")
        for row in range(sprite["rows"]):
            for frame in range(sprite["columns"]):
                box = (frame * sprite["outputCellWidth"], row * sprite["outputCellHeight"], (frame + 1) * sprite["outputCellWidth"], (row + 1) * sprite["outputCellHeight"])
                cell = image.crop(box)
                cell.thumbnail((176, 176), Image.Resampling.LANCZOS)
                panel.alpha_composite(cell, (frame * 180 + (180 - cell.width) // 2, 28 + row * 180 + (180 - cell.height) // 2))
        panels.append(panel)
    contact = Image.new("RGBA", (max(panel.width for panel in panels), sum(panel.height for panel in panels)), "#e6e4d8")
    y = 0
    for panel in panels:
        contact.alpha_composite(panel, (0, y))
        y += panel.height
    output_path.parent.mkdir(parents=True, exist_ok=True)
    contact.save(output_path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", nargs="?", default="assets/characters/enemies/sprite-manifest.json")
    parser.add_argument("--contact-sheet", default="tmp/enemy-clean-contact-sheet.png")
    args = parser.parse_args()
    manifest_path = Path(args.manifest).resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    root = (manifest_path.parent / manifest.get("projectRoot", ".")).resolve()
    sprites = {name: repack_sprite(root, sprite) for name, sprite in manifest["sprites"].items()}
    runtime = {"version": manifest.get("version", 1), "sprites": sprites}
    manifest["sprites"] = sprites
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (root / "enemy-sprite-manifest.js").write_text("window.ENEMY_SPRITE_MANIFEST = " + json.dumps(runtime, indent=2) + ";\n", encoding="utf-8")
    if args.contact_sheet:
        render_contact_sheet(root, sprites, Path(args.contact_sheet).resolve())
    for name, sprite in sprites.items():
        print(f"{name}: {root / sprite['output']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
