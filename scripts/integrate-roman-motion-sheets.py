"""Wire the generated Roman jump/vault sheets into the renderer and manifest."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise RuntimeError(f"expected one renderer match, found {text.count(old)}")
    return text.replace(old, new)


def update_renderer() -> None:
    path = ROOT / "renderer.js"
    text = path.read_text(encoding="utf-8")
    art_anchor = '    hero:image("assets/hero-roman-v4.png"),heroSilver:image("assets/hero-roman-silver-v1.png"),heroDiamond:image("assets/hero-roman-diamond-v1.png"),heroSilverDiamond:image("assets/hero-roman-silver-diamond-v1.png"),sword:image("assets/barbarian-sword-v1.png"),\n'
    art_block = art_anchor + '''    heroMotions:{
      "bronze:gladius":image("assets/characters/roman/motions/bronze-gladius-jump-vault-v1.png"),
      "silver:gladius":image("assets/characters/roman/motions/silver-gladius-jump-vault-v1.png"),
      "bronze:diamond":image("assets/characters/roman/motions/bronze-diamond-jump-vault-v1.png"),
      "silver:diamond":image("assets/characters/roman/motions/silver-diamond-jump-vault-v1.png"),
      "bronze:master":image("assets/characters/roman/motions/bronze-master-jump-vault-v1.png"),
      "silver:master":image("assets/characters/roman/motions/silver-master-jump-vault-v1.png")
    },
'''
    if "heroMotions:{" not in text:
        text = replace_once(text, art_anchor, art_block)

    function_anchor = '''  function heroArtFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",preferred=buildEquipmentSheet(armor,weapon),fallback=buildEquipmentSheet(armor,"gladius");
    return preferred.complete&&preferred.naturalWidth?preferred:fallback.complete&&fallback.naturalWidth?fallback:art.hero;
  }
'''
    function_block = function_anchor + '''  function heroMotionArtFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",preferred=art.heroMotions[`${armor}:${weapon}`],fallback=art.heroMotions[`${armor}:gladius`];
    return preferred?.complete&&preferred.naturalWidth?preferred:fallback?.complete&&fallback.naturalWidth?fallback:null;
  }
'''
    if "function heroMotionArtFor" not in text:
        text = replace_once(text, function_anchor, function_block)

    old_motion = '''    if(p.vaultDown>0&&p.attack<=0&&p.slingAnim<=0&&!p.shielding){
      const phase=G.clamp(1-p.vaultDown/.34,0,1),frames=[4,5,0,1,2,3],frame=frames[Math.min(5,Math.floor(phase*6))],size=156,bottom=spriteBottoms.hero[0][frame],heroArt=heroArtFor(p),pivotX=G.cx(p),pivotY=p.y+p.h-8;
      ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate(p.facing*(.1+phase*.18));ctx.translate(-pivotX,-pivotY);anchoredSheet(heroArt,6,4,0,frame,G.cx(p)-size/2,p.y+p.h+phase*7,size,size,p.facing<0,1,0,bottom);ctx.restore();return;
    }
    if(!p.grounded&&p.attack<=0&&p.slingAnim<=0&&!p.shielding){
      const frame=p.vy<-560?1:p.vy<-150?2:p.vy<170?3:p.vy<560?4:5,size=156,bottom=spriteBottoms.hero[0][frame],heroArt=heroArtFor(p),pivotX=G.cx(p),pivotY=p.y+p.h-10,angle=G.clamp(p.vy/4200,-.1,.16)*p.facing;
      ctx.save();ctx.translate(pivotX,pivotY);ctx.rotate(angle);ctx.translate(-pivotX,-pivotY);anchoredSheet(heroArt,6,4,0,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing<0,1,0,bottom);ctx.restore();return;
    }
'''
    new_motion = '''    if(p.vaultDown>0&&p.attack<=0&&p.slingAnim<=0&&!p.shielding){
      const phase=G.clamp(1-p.vaultDown/.34,0,1),frame=Math.min(5,Math.floor(phase*6)),size=164,motionArt=heroMotionArtFor(p);
      if(motionArt){anchoredSheet(motionArt,6,2,1,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing<0,1,0,246);return}
    }
    if(!p.grounded&&p.attack<=0&&p.slingAnim<=0&&!p.shielding){
      const frame=p.vy<-740?0:p.vy<-500?1:p.vy<-150?2:p.vy<180?3:p.vy<600?4:5,size=164,motionArt=heroMotionArtFor(p);
      if(motionArt){anchoredSheet(motionArt,6,2,0,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing<0,1,0,246);return}
    }
'''
    if old_motion in text:
        text = replace_once(text, old_motion, new_motion)
    elif new_motion not in text:
        raise RuntimeError("renderer motion block is not in a recognized state")
    path.write_text(text, encoding="utf-8")


def update_manifest() -> None:
    json_path = ROOT / "assets" / "characters" / "roman" / "equipment-manifest.json"
    manifest = json.loads(json_path.read_text(encoding="utf-8"))
    sources = {
        "bronze": {
            "gladius": "assets/characters/roman/motions/bronze-gladius-jump-vault-v1.png",
            "diamond": "assets/characters/roman/motions/bronze-diamond-jump-vault-v1.png",
            "master": "assets/characters/roman/motions/bronze-master-jump-vault-v1.png",
        },
        "silver": {
            "gladius": "assets/characters/roman/motions/silver-gladius-jump-vault-v1.png",
            "diamond": "assets/characters/roman/motions/silver-diamond-jump-vault-v1.png",
            "master": "assets/characters/roman/motions/silver-master-jump-vault-v1.png",
        },
    }
    manifest["motionSheets"] = {
        "grid": {"columns": 6, "rows": 2, "cellWidth": 256, "cellHeight": 256},
        "transparentGutter": 10,
        "bottomAnchor": 246,
        "sourcesByArmorAndWeapon": sources,
    }
    manifest["motions"]["jump"] = {
        "row": 0,
        "poseFamily": "one_handed_airborne",
        "composition": "pose_specific_generated",
        "decisionLevel": 4,
        "frameMap": [0, 1, 2, 3, 4, 5],
    }
    manifest["motions"]["vaultDown"] = {
        "row": 1,
        "poseFamily": "one_handed_platform_vault_down",
        "composition": "pose_specific_generated",
        "decisionLevel": 4,
        "frameMap": [0, 1, 2, 3, 4, 5],
        "duration": 0.34,
    }
    payload = json.dumps(manifest, indent=2) + "\n"
    json_path.write_text(payload, encoding="utf-8")
    (ROOT / "equipment-manifest.js").write_text(
        "window.ROMAN_EQUIPMENT_MANIFEST = " + json.dumps(manifest, indent=2) + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    update_renderer()
    update_manifest()
