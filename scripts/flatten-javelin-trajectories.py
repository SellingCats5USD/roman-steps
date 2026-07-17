"""One-time migration: give enemy javelins a shallow, directly aimed arc."""

from pathlib import Path


path = Path(__file__).resolve().parents[1] / "engine.js"
text = path.read_text(encoding="utf-8")
old_spawn = '''  function spawnBolt(x,y,tx,ty,speed=560){speed*=.67*.67;const dx=tx-x,dir=Math.sign(dx)||1,t=Math.max(.35,Math.abs(dx)/speed),w=51,h=13.5;bolts.push({x:x-w/2,y:y-h/2,w,h,vx:dir*speed,vy:(ty-y-.5*520*t*t)/t,life:Math.max(4.8,t+1.2),angle:0})}
'''
new_spawn = '''  const JAVELIN_GRAVITY=42;
  function spawnBolt(x,y,tx,ty,speed=560){speed*=.67*.67;const dx=tx-x,dir=Math.sign(dx)||1,t=Math.max(.35,Math.abs(dx)/speed),w=51,h=13.5;bolts.push({x:x-w/2,y:y-h/2,w,h,vx:dir*speed,vy:(ty-y-.5*JAVELIN_GRAVITY*t*t)/t,life:Math.max(4.8,t+1.2),angle:0})}
'''
old_update = "b.life-=dt;b.vy+=520*dt;b.x+=b.vx*dt;"
new_update = "b.life-=dt;b.vy+=JAVELIN_GRAVITY*dt;b.x+=b.vx*dt;"
if text.count(old_spawn) != 1 or text.count(old_update) != 1:
    raise RuntimeError("javelin physics are not in the expected state")
path.write_text(text.replace(old_spawn, new_spawn).replace(old_update, new_update), encoding="utf-8")
