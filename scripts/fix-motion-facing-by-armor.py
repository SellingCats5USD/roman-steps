"""Declare and apply source-facing metadata for generated motion sheets."""

from __future__ import annotations

import json
from pathlib import Path


root = Path(__file__).resolve().parents[1]
renderer_path = root / "renderer.js"
renderer = renderer_path.read_text(encoding="utf-8")

function_anchor = '''  function heroMotionArtFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",preferred=art.heroMotions[`${armor}:${weapon}`],fallback=art.heroMotions[`${armor}:gladius`];
    return preferred?.complete&&preferred.naturalWidth?preferred:fallback?.complete&&fallback.naturalWidth?fallback:null;
  }
'''
function_block = function_anchor + '''  function heroMotionFlipFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",sourceFacing=equipmentManifest.motionSheets?.sourceFacingByArmorAndWeapon?.[armor]?.[weapon]||equipmentManifest.motionSheets?.sourceFacingByArmor?.[armor]||"right";
    return sourceFacing==="left"?p.facing>0:p.facing<0;
  }
'''
if "function heroMotionFlipFor" not in renderer:
    if renderer.count(function_anchor) != 1:
        raise RuntimeError("heroMotionArtFor block is not in the expected state")
    renderer = renderer.replace(function_anchor, function_block, 1)

old = "p.facing>0,1,0,246"
new = "heroMotionFlipFor(p),1,0,246"
if renderer.count(old) != 2:
    raise RuntimeError(f"expected two generated motion flip calls, found {renderer.count(old)}")
renderer_path.write_text(renderer.replace(old, new), encoding="utf-8")

manifest_path = root / "assets" / "characters" / "roman" / "equipment-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["motionSheets"]["sourceFacingByArmor"] = {"bronze": "right", "silver": "left"}
manifest["motionSheets"]["sourceFacingByArmorAndWeapon"] = {
    "bronze": {"gladius": "right", "diamond": "left", "master": "left"},
    "silver": {"gladius": "left", "diamond": "left", "master": "left"},
}
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
(root / "equipment-manifest.js").write_text(
    "window.ROMAN_EQUIPMENT_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n",
    encoding="utf-8",
)
