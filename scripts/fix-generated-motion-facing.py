"""One-time migration: generated motion sheets face left in their source cells."""

from pathlib import Path


path = Path(__file__).resolve().parents[1] / "renderer.js"
text = path.read_text(encoding="utf-8")
old_vault = "anchoredSheet(motionArt,6,2,1,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing<0,1,0,246)"
new_vault = "anchoredSheet(motionArt,6,2,1,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing>0,1,0,246)"
old_jump = "anchoredSheet(motionArt,6,2,0,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing<0,1,0,246)"
new_jump = "anchoredSheet(motionArt,6,2,0,frame,G.cx(p)-size/2,p.y+p.h,size,size,p.facing>0,1,0,246)"
if text.count(old_vault) != 1 or text.count(old_jump) != 1:
    raise RuntimeError("generated-motion renderer calls are not in the expected state")
path.write_text(text.replace(old_vault, new_vault).replace(old_jump, new_jump), encoding="utf-8")
