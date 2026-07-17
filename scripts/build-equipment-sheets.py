#!/usr/bin/env python3
"""Build canonical, sparse-patch, and layered Roman equipment outputs."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import sys

from PIL import Image, ImageDraw

SKILL_COMPOSER = Path.home() / ".codex" / "skills" / "compose-modular-sprites" / "scripts" / "compose_sprite_manifest.py"
HERE = Path(__file__).resolve().parent


def run_main(path: Path, arguments: list[str]) -> None:
    old_argv = sys.argv
    sys.argv = [str(path), *arguments]
    try:
        runpy.run_path(str(path), run_name="__main__")
    except SystemExit as error:
        if error.code not in (None, 0):
            raise
    finally:
        sys.argv = old_argv


def checkerboard(width: int, height: int, tile: int = 12) -> Image.Image:
    image = Image.new("RGBA", (width, height), "#eeeeea")
    draw = ImageDraw.Draw(image)
    for y in range(0, height, tile):
        for x in range(0, width, tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill="#d8d8d4")
    return image


def render_contact_sheet(data: dict, root: Path, output: Path) -> None:
    grid = data["grid"]
    panels: list[tuple[str, Image.Image]] = []
    for weapon_id, weapon in data["weapons"].items():
        if weapon.get("composition") == "canonical":
            continue
        for armor_id in data["armors"]:
            rel = weapon.get("outputsByArmor", {}).get(armor_id)
            if not rel:
                continue
            path = root / rel
            if not path.is_file():
                raise FileNotFoundError(path)
            panels.append((f"{armor_id} / {weapon_id}", Image.open(path).convert("RGBA")))
    cell_w, cell_h = grid["cellWidth"], grid["cellHeight"]
    frame_w, frame_h = cell_w // 2, cell_h // 2
    panel_w, panel_h = frame_w * grid["columns"], frame_h * 2 + 28
    contact = checkerboard(panel_w, panel_h * len(panels))
    draw = ImageDraw.Draw(contact)
    for panel, (label, sheet) in enumerate(panels):
        top = panel * panel_h
        draw.rectangle((0, top, panel_w, top + 27), fill="#283765")
        draw.text((10, top + 7), label, fill="#fff8e9")
        for row in range(2):
            for frame in range(grid["columns"]):
                crop = sheet.crop((frame * cell_w, row * cell_h, (frame + 1) * cell_w, (row + 1) * cell_h))
                crop = crop.resize((frame_w, frame_h), Image.Resampling.LANCZOS)
                contact.alpha_composite(crop, (frame * frame_w, top + 28 + row * frame_h))
    output.parent.mkdir(parents=True, exist_ok=True)
    contact.save(output)
    print(output)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest")
    parser.add_argument("--output-dir")
    parser.add_argument("--contact-sheet")
    args = parser.parse_args()
    manifest_path = Path(args.manifest).resolve()
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    root = (manifest_path.parent / data.get("projectRoot", ".")).resolve()

    if any(weapon.get("composition") in {"layered", "wide_cells"} for weapon in data["weapons"].values()):
        run_main(HERE / "build-master-diamond-sword-sheets.py", [])

    filtered = dict(data)
    filtered["weapons"] = {
        key: value
        for key, value in data["weapons"].items()
        if value.get("composition") not in {"layered", "image_edited", "wide_cells"}
    }
    temporary = manifest_path.parent / ".equipment-manifest-compose.tmp.json"
    temporary.write_text(json.dumps(filtered, indent=2), encoding="utf-8")
    composer_args = [str(temporary)]
    if args.output_dir:
        composer_args.extend(["--output-dir", args.output_dir])
    try:
        run_main(SKILL_COMPOSER, composer_args)
    finally:
        temporary.unlink(missing_ok=True)

    if args.contact_sheet:
        render_contact_sheet(data, root, Path(args.contact_sheet).resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
