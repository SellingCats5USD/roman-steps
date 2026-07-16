#!/usr/bin/env python3
"""Validate the base manifest plus layered equipment sources and patches."""
from __future__ import annotations

import json
from pathlib import Path
import runpy
import struct
import sys

SKILL_VALIDATOR = Path.home() / ".codex" / "skills" / "compose-modular-sprites" / "scripts" / "validate_sprite_manifest.py"


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()[:24]
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"not a PNG: {path}")
    return struct.unpack(">II", data[16:24])


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate-equipment-manifest.py MANIFEST.json", file=sys.stderr)
        return 2
    manifest_path = Path(sys.argv[1]).resolve()
    old_argv = sys.argv
    try:
        sys.argv = [str(SKILL_VALIDATOR), str(manifest_path)]
        try:
            runpy.run_path(str(SKILL_VALIDATOR), run_name="__main__")
        except SystemExit as error:
            if error.code not in (None, 0):
                return int(error.code)
    finally:
        sys.argv = old_argv

    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    root = (manifest_path.parent / data.get("projectRoot", ".")).resolve()
    expected = (data["grid"]["columns"] * data["grid"]["cellWidth"], data["grid"]["rows"] * data["grid"]["cellHeight"])
    for weapon_id, weapon in data["weapons"].items():
        if weapon.get("composition") == "image_edited":
            if weapon.get("decisionLevel") != 3 or weapon.get("editedRows") != [0, 1] or weapon.get("sharedRows") != [2, 3]:
                raise ValueError(f"invalid image-edited declaration for {weapon_id}")
            for rel in weapon.get("outputsByArmor", {}).values():
                path = root / rel
                if not path.is_file() or png_size(path) != expected:
                    raise ValueError(f"invalid image-edited output: {path}")
            print(f"OK image-edited: {weapon_id} ? pose-specific weapon edits with canonical shared rows")
            continue
        if weapon.get("composition") != "layered":
            continue
        for field in ("weaponLayer", "baseSourcesByArmor", "interactionSourcesByArmor", "outputsByArmor", "interactionPatches", "zOrder"):
            if field not in weapon:
                raise ValueError(f"layered weapon {weapon_id} is missing {field}")
        paths = [weapon["weaponLayer"], *weapon["baseSourcesByArmor"].values(), *weapon["interactionSourcesByArmor"].values(), *weapon["outputsByArmor"].values()]
        for rel in paths:
            path = root / rel
            if not path.is_file() or png_size(path) != expected:
                raise ValueError(f"invalid layered source: {path}")
        seen = set()
        for patch in weapon["interactionPatches"]:
            row, frame = patch["row"], patch["frame"]
            x, y, width, height = patch["rect"]
            if (row, frame) in seen or not (0 <= row < data["grid"]["rows"] and 0 <= frame < data["grid"]["columns"]):
                raise ValueError(f"invalid interaction patch cell for {weapon_id}: {(row, frame)}")
            if min(x, y, width, height) < 0 or x + width > data["grid"]["cellWidth"] or y + height > data["grid"]["cellHeight"]:
                raise ValueError(f"interaction patch crosses a cell for {weapon_id}: {(row, frame)}")
            seen.add((row, frame))
        if len(seen) != 12:
            raise ValueError(f"{weapon_id} must declare 12 walk/attack interaction patches")
        print(f"OK layered: {weapon_id} — shared weapon layer, {len(seen)} interaction patches")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)