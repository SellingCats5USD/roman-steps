const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const barbarianWalk = new Image();
barbarianWalk.src = "assets/hero-walk.png";
const mountedBarbarian = new Image();
mountedBarbarian.src = "assets/barbarian-mounted-v2.png";
const romanHero = new Image();
romanHero.src = "assets/hero-roman-v3.png";
const javelinBarbarian = new Image();
javelinBarbarian.src = "assets/barbarian-javelin-v1.png";

const W = canvas.width;
const H = canvas.height;
const WORLD_WIDTH = 5200;
const GRAVITY = 2500;
const keys = new Set();

let state = "menu";
let lastTime = 0;
let cameraX = 0;
let coins = [];
let enemies = [];
let particles = [];
let projectiles = [];
let elapsed = 0;
let checkpoint = { x: 120, y: 400 };

const player = {
  x: 120, y: 400, w: 48, h: 94,
  vx: 0, vy: 0, speed: 390, jump: 1000,
  grounded: false, facing: 1, lives: 3, coins: 0,
  invulnerable: 0, coyote: 0, jumpBuffer: 0,
  attackTimer: 0, attackCooldown: 0, attackId: 0, blocking: false,
  shieldHits: 0, shieldCooldown: 0, shieldRaiseTimer: 0, shieldImpactTimer: 0, shieldRetractTimer: 0
};

const platforms = [
  { x: 0, y: 590, w: 850, h: 130, ground: true },
  { x: 970, y: 590, w: 690, h: 130, ground: true },
  { x: 1770, y: 590, w: 820, h: 130, ground: true },
  { x: 2710, y: 590, w: 520, h: 130, ground: true },
  { x: 3360, y: 590, w: 700, h: 130, ground: true },
  { x: 4190, y: 590, w: 1010, h: 130, ground: true },
  { x: 430, y: 440, w: 210, h: 34 },
  { x: 1080, y: 445, w: 180, h: 34 },
  { x: 1370, y: 350, w: 175, h: 34 },
  { x: 1900, y: 430, w: 200, h: 34 },
  { x: 2210, y: 335, w: 210, h: 34 },
  { x: 2800, y: 430, w: 170, h: 34 },
  { x: 3450, y: 415, w: 230, h: 34 },
  { x: 3780, y: 315, w: 150, h: 34 },
  { x: 4330, y: 440, w: 190, h: 34 },
  { x: 4620, y: 345, w: 170, h: 34 }
];

const bushes = [280, 720, 1140, 1520, 1980, 2460, 2870, 3500, 3970, 4400, 4880];

function resetGame() {
  Object.assign(player, {
    x:120,y:400,vx:0,vy:0,lives:3,coins:0,invulnerable:0,
    attackTimer:0,attackCooldown:0,attackId:0,blocking:false,
    shieldHits:0,shieldCooldown:0,shieldRaiseTimer:0,shieldImpactTimer:0,shieldRetractTimer:0
  });
  checkpoint={x:120,y:400};cameraX=0;elapsed=0;particles=[];projectiles=[];
  coins=[
    [350,520],[480,375],[550,375],[620,375],[1050,520],[1130,380],[1210,380],
    [1398,285],[1470,285],[1840,520],[1945,365],[2025,365],[2250,270],[2340,270],
    [2780,520],[2840,365],[2920,365],[3410,520],[3500,335],[3580,335],[3820,250],
    [4260,520],[4370,375],[4450,375],[4660,280],[4735,280],[4890,520]
  ].map(([x,y])=>({x,y,r:14,collected:false,phase:Math.random()*6}));
  enemies=[
    [690,535,540,800],[1190,535,1000,1380],[2030,535,1790,2500],
    [2880,535,2730,3160],[3600,535,3380,3740],[4440,535,4210,4830]
  ].map(([x,y,min,max],i)=>({
    type:"foot",x,y,w:48,h:48,vx:i%2?72:-72,min,max,alive:true,
    hp:1,maxHp:1,knockbackV:0,hitFlash:0,lastHitAttack:-1
  }));
  enemies.push(
    {type:"javelin",x:2380,y:512,w:48,h:78,vx:-36,min:2140,max:2525,alive:true,hp:1,maxHp:1,
      facing:-1,ai:"patrol",stateTimer:0,attackCooldown:1.0,didThrow:false,knockbackV:0,hitFlash:0,lastHitAttack:-1},
    {type:"javelin",x:4700,y:512,w:48,h:78,vx:36,min:4380,max:4940,alive:true,hp:1,maxHp:1,
      facing:1,ai:"patrol",stateTimer:0,attackCooldown:1.5,didThrow:false,knockbackV:0,hitFlash:0,lastHitAttack:-1},
    {type:"mounted",x:1450,y:510,w:104,h:80,vx:0,min:995,max:1640,alive:true,hp:4,maxHp:4,
      facing:-1,ai:"patrol",stateTimer:0,chargeCooldown:1.2,chargeDir:-1,chargeStartX:1450,knockbackV:0,hitFlash:0,lastHitAttack:-1},
    {type:"mounted",x:3825,y:510,w:104,h:80,vx:0,min:3380,max:4040,alive:true,hp:5,maxHp:5,
      facing:-1,ai:"patrol",stateTimer:0,chargeCooldown:.7,chargeDir:-1,chargeStartX:3825,knockbackV:0,hitFlash:0,lastHitAttack:-1}
  );
}
function startGame() {
  resetGame();
  state = "playing";
  document.getElementById("start-screen").classList.remove("visible");
  document.getElementById("message-screen").classList.remove("visible");
}

function showEnd(won) {
  state=won?"won":"lost";
  document.getElementById("message-eyebrow").textContent=won?"LEVEL COMPLETE":"TRY AGAIN";
  document.getElementById("message-title").textContent=won?"Shining work!":"Almost there!";
  document.getElementById("message-text").textContent=won
    ? `You gathered ${player.coins} of ${coins.length} denarii in ${Math.floor(elapsed)} seconds.`
    : "The barbarians stopped your campaign this time.";
  document.getElementById("message-screen").classList.add("visible");
}

document.getElementById("start-button").addEventListener("click",startGame);
document.getElementById("restart-button").addEventListener("click",startGame);

function startAttack(){
  if(state!=="playing"||player.attackCooldown>0||keys.has("s"))return;
  player.attackTimer=.28;player.attackCooldown=.38;player.attackId++;
  burst(player.x+player.w/2+player.facing*28,player.y+30,"#f7e7b1",5);
}

addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(["w","a","s","d"," ","arrowup","arrowleft","arrowright"].includes(k))e.preventDefault();
  if(state==="menu"&&(k==="enter"||k===" ")){startGame();keys.add(k);return;}
  if((k==="w"||k==="arrowup")&&!keys.has(k))player.jumpBuffer=.13;
  if(k===" "&&!keys.has(k))startAttack();
  if(k==="r"&&state!=="menu")startGame();
  keys.add(k);
});
addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function overlap(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

function burst(x,y,color,count=10) {
  for (let i=0;i<count;i++) particles.push({
    x,y,vx:(Math.random()-.5)*360,vy:-Math.random()*360-40,
    life:.5+Math.random()*.35,max:.85,size:4+Math.random()*6,color
  });
}

function isBlockingAttack(sourceX){
  if(!player.blocking||sourceX==null)return false;
  const direction=sourceX-(player.x+player.w/2);
  return direction===0||Math.sign(direction)===player.facing;
}

function hurtPlayer(sourceX=null){
  if(player.invulnerable>0)return false;
  if(isBlockingAttack(sourceX)){
    player.shieldHits++;player.shieldImpactTimer=.26;
    burst(player.x+player.w/2+player.facing*28,player.y+35,"#f3d37b",12);
    player.vx=-player.facing*115;player.invulnerable=.16;
    if(player.shieldHits>3){
      player.shieldHits=0;player.shieldCooldown=5;player.shieldRetractTimer=.38;player.blocking=false;
      burst(player.x+player.w/2,player.y+36,"#b7373f",18);
    }
    return false;
  }
  player.lives--;
  burst(player.x+21,player.y+25,"#ff665e",16);
  if(player.lives<=0){showEnd(false);return true;}
  Object.assign(player,{x:checkpoint.x,y:checkpoint.y,vx:0,vy:-250,invulnerable:1.8,blocking:false});
  return true;
}

function update(dt) {
  if (state !== "playing") return;
  elapsed += dt;
  player.invulnerable = Math.max(0, player.invulnerable-dt);
  player.attackTimer = Math.max(0, player.attackTimer-dt);
  player.attackCooldown = Math.max(0, player.attackCooldown-dt);
  player.shieldCooldown = Math.max(0, player.shieldCooldown-dt);
  player.shieldRaiseTimer = Math.max(0, player.shieldRaiseTimer-dt);
  player.shieldImpactTimer = Math.max(0, player.shieldImpactTimer-dt);
  player.shieldRetractTimer = Math.max(0, player.shieldRetractTimer-dt);
  player.jumpBuffer = Math.max(0, player.jumpBuffer-dt);
  player.coyote = player.grounded ? .11 : Math.max(0, player.coyote-dt);

  const left = keys.has("a") || keys.has("arrowleft");
  const right = keys.has("d") || keys.has("arrowright");
  const wasBlocking=player.blocking;
  player.blocking=keys.has("s")&&player.attackTimer<=0&&player.shieldCooldown<=0;
  if(player.blocking&&!wasBlocking)player.shieldRaiseTimer=.3;
  if(!player.blocking&&wasBlocking&&player.shieldCooldown<=0)player.shieldRetractTimer=.22;
  const target = (right-left) * player.speed * (player.blocking?.22:1);
  player.vx += (target-player.vx) * Math.min(1, dt*(player.grounded ? 13 : 7));
  if (right || left) player.facing = right ? 1 : -1;
  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = -player.jump; player.grounded = false; player.coyote = 0; player.jumpBuffer = 0;
    burst(player.x+21, player.y+player.h, "#e9e1bd", 7);
  }
  if (!(keys.has("w") || keys.has("arrowup")) && player.vy < -300) player.vy += GRAVITY*1.2*dt;

  player.vy += GRAVITY*dt;
  player.x += player.vx*dt;
  player.x = Math.max(0, Math.min(WORLD_WIDTH-player.w, player.x));
  for (const p of platforms) if (overlap(player,p)) {
    if (player.vx > 0) player.x = p.x-player.w;
    else if (player.vx < 0) player.x = p.x+p.w;
    player.vx = 0;
  }

  const oldBottom = player.y+player.h;
  player.y += player.vy*dt;
  player.grounded = false;
  for (const p of platforms) if (overlap(player,p)) {
    if (player.vy >= 0 && oldBottom <= p.y+8) {
      player.y = p.y-player.h; player.vy = 0; player.grounded = true;
    } else if (player.vy < 0) { player.y = p.y+p.h; player.vy = 40; }
  }

  if (player.y > H+140) hurtPlayer();
  if (player.x > 3300) checkpoint = { x: 3400, y: 470 };

  for (const c of coins) if (!c.collected) {
    const dx = player.x+player.w/2-c.x, dy=player.y+player.h/2-c.y;
    if (dx*dx+dy*dy < 42*42) { c.collected=true; player.coins++; burst(c.x,c.y,"#ffd33d",12); }
  }

  const attackActive=player.attackTimer>.08&&player.attackTimer<.23;
  const bladeBox={
    x:player.facing>0?player.x+player.w-3:player.x-66,
    y:player.y+18,w:72,h:38
  };

  for(const e of enemies)if(e.alive){
    e.hitFlash=Math.max(0,e.hitFlash-dt);
    e.chargeCooldown=Math.max(0,(e.chargeCooldown||0)-dt);

    if(Math.abs(e.knockbackV)>5){
      e.x+=e.knockbackV*dt;e.knockbackV*=Math.pow(.035,dt);
    }else if(e.type==="mounted"){
      const dx=player.x+player.w/2-(e.x+e.w/2);
      if(e.ai==="patrol"){
        if(e.x<=e.min+3)e.facing=1;
        if(e.x+e.w>=e.max-3)e.facing=-1;
        e.x+=e.facing*52*dt;
        const desiredDir=dx>=0?1:-1;
        const runway=desiredDir>0?e.max-(e.x+e.w):e.x-e.min;
        if(Math.abs(dx)<720&&Math.abs(player.y-e.y)<145&&runway>125&&e.chargeCooldown<=0){
          e.ai="windup";e.stateTimer=1.05;e.vx=0;e.chargeDir=desiredDir;e.facing=desiredDir;
        }
      }else if(e.ai==="windup"){
        e.stateTimer-=dt;e.facing=e.chargeDir;
        if(Math.random()<dt*14)burst(e.x+e.w/2,e.y+e.h,"#d6b98c",1);
        if(e.stateTimer<=0){
          e.ai="charge";e.stateTimer=.78;e.vx=e.chargeDir*620;e.chargeStartX=e.x;
        }
      }else if(e.ai==="charge"){
        e.stateTimer-=dt;e.x+=e.vx*dt;
        const hitEdge=e.x<=e.min||e.x+e.w>=e.max;
        if(e.stateTimer<=0||hitEdge){
          e.ai="recover";e.stateTimer=.72;e.vx=0;e.chargeCooldown=2.1;
        }
      }else{
        e.stateTimer-=dt;
        if(e.stateTimer<=0){e.ai="patrol";e.facing=e.chargeDir>0?-1:1;}
      }
      e.x=Math.max(e.min,Math.min(e.max-e.w,e.x));
    }else if(e.type==="javelin"){
      e.attackCooldown=Math.max(0,(e.attackCooldown||0)-dt);
      const dx=player.x+player.w/2-(e.x+e.w/2);
      if(e.ai==="patrol"){
        if(e.x<=e.min+2)e.facing=1;
        if(e.x+e.w>=e.max-2)e.facing=-1;
        e.vx=e.facing*36;e.x+=e.vx*dt;
        if(Math.abs(dx)<650&&Math.abs(player.y-e.y)<175&&e.attackCooldown<=0){
          e.ai="throw";e.stateTimer=.78;e.didThrow=false;e.facing=dx>=0?1:-1;e.vx=0;
        }
      }else{
        e.stateTimer-=dt;e.facing=dx>=0?1:-1;
        if(!e.didThrow&&e.stateTimer<=.34){
          const ox=e.x+e.w/2+e.facing*22,oy=e.y+28;
          const tx=player.x+player.w/2,ty=player.y+player.h*.42;
          const aimX=tx-ox,aimY=ty-oy,dist=Math.max(1,Math.hypot(aimX,aimY));
          const speed=555;
          projectiles.push({x:ox,y:oy,vx:aimX/dist*speed,vy:aimY/dist*speed-95,angle:Math.atan2(aimY,aimX),alive:true});
          e.didThrow=true;burst(ox,oy,"#d6b98c",5);
        }
        if(e.stateTimer<=0){e.ai="patrol";e.attackCooldown=2.25;e.vx=e.facing*36;}
      }
      e.x=Math.max(e.min,Math.min(e.max-e.w,e.x));
    }else{
      e.x+=e.vx*dt;
      if(e.x<e.min||e.x+e.w>e.max){e.vx*=-1;e.x=Math.max(e.min,Math.min(e.max-e.w,e.x));}
    }

    if(attackActive&&e.lastHitAttack!==player.attackId&&overlap(bladeBox,e)){
      e.lastHitAttack=player.attackId;e.hp--;e.hitFlash=.16;
      e.knockbackV=player.facing*(e.type==="mounted"?310:430);
      burst(e.x+e.w/2,e.y+e.h/2,e.type==="mounted"?"#e7b94d":"#b8784e",12);
      if(e.type==="mounted"){e.ai="recover";e.stateTimer=.55;e.chargeCooldown=1.1;}
      if(e.hp<=0){e.alive=false;burst(e.x+e.w/2,e.y+e.h/2,"#8b2632",20);}
      continue;
    }

    if(overlap(player,e)){
      if(player.vy>120&&oldBottom<=e.y+18){
        if(e.type==="mounted"){
          e.hp--;e.hitFlash=.16;e.knockbackV=player.facing*220;player.vy=-650;
          e.ai="recover";e.stateTimer=.55;e.chargeCooldown=1.1;
          if(e.hp<=0)e.alive=false;
        }else{e.alive=false;player.vy=-620;}
        burst(e.x+e.w/2,e.y+15,"#9a6739",14);
      }else if(e.type==="mounted"&&e.ai!=="charge"){
        const playerCenter=player.x+player.w/2,enemyCenter=e.x+e.w/2;
        if(playerCenter<enemyCenter)player.x=e.x-player.w-2;
        else player.x=e.x+e.w+2;
        player.vx=0;
      }else{
        const sourceX=e.x+e.w/2;
        const blocked=isBlockingAttack(sourceX);
        hurtPlayer(sourceX);
        if(blocked){
          e.knockbackV=player.facing*(e.type==="mounted"?350:240);
          if(e.type==="mounted"){e.ai="recover";e.stateTimer=.72;e.vx=0;e.chargeCooldown=1.6;}
        }
      }
    }
  }

  for(const j of projectiles)if(j.alive){
    j.x+=j.vx*dt;j.y+=j.vy*dt;j.vy+=430*dt;j.angle=Math.atan2(j.vy,j.vx);
    const tip={x:j.x-8,y:j.y-8,w:16,h:16};
    if(overlap(player,tip)){j.alive=false;hurtPlayer(j.x);continue;}
    for(const p of platforms)if(j.x>p.x&&j.x<p.x+p.w&&j.y>p.y&&j.y<p.y+p.h){j.alive=false;break;}
    if(j.x<cameraX-300||j.x>cameraX+W+300||j.y>H+100)j.alive=false;
  }
  projectiles=projectiles.filter(j=>j.alive);

  for (const p of particles) { p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=900*dt; p.life-=dt; }
  particles = particles.filter(p=>p.life>0);
  cameraX += (Math.max(0,Math.min(WORLD_WIDTH-W, player.x-W*.35))-cameraX)*Math.min(1,dt*5);
  if (player.x > 5000) showEnd(true);
}

function roundRect(x,y,w,h,r,fill) {
  ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fillStyle=fill; ctx.fill();
}

function drawCloud(x,y,s=1) {
  ctx.fillStyle="#fff"; ctx.globalAlpha=.88;
  ctx.beginPath(); ctx.arc(x,y,34*s,0,Math.PI*2); ctx.arc(x+38*s,y-18*s,44*s,0,Math.PI*2);
  ctx.arc(x+82*s,y,32*s,0,Math.PI*2); ctx.rect(x,y,82*s,32*s); ctx.fill(); ctx.globalAlpha=1;
}

function drawBackground() {
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,"#c96f4b"); grad.addColorStop(.58,"#efbd79"); grad.addColorStop(1,"#f4d59d");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#f7df9a";ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(1060,108,55,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for (let i=0;i<7;i++) drawCloud(((i*470-cameraX*.1)%1900)-180,92+(i%3)*65,.65+(i%2)*.2);

  ctx.fillStyle="#c98966";ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(0,520);
  for(let x=-120;x<=W+200;x+=230)ctx.lineTo(x+115,330+(x%460)*.08),ctx.lineTo(x+230,520);
  ctx.lineTo(W,720);ctx.lineTo(0,720);ctx.fill();ctx.globalAlpha=1;

  const aqOffset=-((cameraX*.2)%260);
  ctx.fillStyle="#b67858";ctx.globalAlpha=.55;
  for(let x=aqOffset-260;x<W+260;x+=130){
    ctx.fillRect(x,355,18,190);ctx.fillRect(x+112,355,18,190);ctx.fillRect(x,350,130,18);
    ctx.beginPath();ctx.arc(x+65,437,47,Math.PI,0);ctx.lineTo(x+112,545);ctx.lineTo(x+18,545);ctx.closePath();ctx.fill();
    ctx.fillStyle="#e7b77c";ctx.beginPath();ctx.arc(x+65,440,31,Math.PI,0);ctx.lineTo(x+96,545);ctx.lineTo(x+34,545);ctx.closePath();ctx.fill();
    ctx.fillStyle="#b67858";
  }
  ctx.globalAlpha=1;
}
function drawPlatform(p) {
  const x=p.x-cameraX; if(x>W||x+p.w<0)return;
  const marble=p.ground?"#ded5c2":"#eee8dc";
  ctx.fillStyle="#9d7d64";ctx.fillRect(x+5,p.y+9,p.w,p.h);
  ctx.fillStyle=marble;ctx.fillRect(x,p.y,p.w,p.h);
  ctx.fillStyle="#f8f3e7";ctx.fillRect(x,p.y,p.w,8);
  ctx.fillStyle="#c6a45d";ctx.fillRect(x,p.y+8,p.w,6);
  ctx.fillStyle="#b9954e";ctx.fillRect(x,p.y+14,p.w,2);
  ctx.strokeStyle=p.ground?"#b7aa96":"#cfc5b3";ctx.lineWidth=2;
  for(let tx=0;tx<p.w;tx+=58){
    const px=x+tx;
    ctx.beginPath();ctx.moveTo(px,p.y+28+(tx%3)*13);ctx.bezierCurveTo(px+14,p.y+17,px+24,p.y+55,px+43,p.y+38);ctx.stroke();
  }
  if(!p.ground){
    ctx.fillStyle="#d5cbb9";
    for(let tx=12;tx<p.w;tx+=42){ctx.fillRect(x+tx,p.y+p.h-10,24,5);}
  } else {
    ctx.strokeStyle="#c5b9a5";ctx.lineWidth=1;
    for(let yy=p.y+68;yy<p.y+p.h;yy+=38){ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+p.w,yy);ctx.stroke();}
  }
}
function drawBush(wx) {
  const x=wx-cameraX;if(x<-130||x>W+130)return;
  ctx.fillStyle="#6f4a2d";ctx.fillRect(x+36,510,10,80);
  ctx.fillStyle="#326044";
  ctx.beginPath();ctx.moveTo(x+41,405);ctx.quadraticCurveTo(x-2,490,x+24,555);
  ctx.quadraticCurveTo(x+41,575,x+58,555);ctx.quadraticCurveTo(x+84,490,x+41,405);ctx.fill();
  ctx.fillStyle="#52754d";ctx.globalAlpha=.7;
  ctx.beginPath();ctx.ellipse(x+31,493,13,42,-.25,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
}
function drawCoin(c) {
  if(c.collected)return;const x=c.x-cameraX;if(x<-30||x>W+30)return;
  const pulse=.72+Math.abs(Math.sin(elapsed*5+c.phase))*.28;
  ctx.save();ctx.translate(x,c.y);ctx.scale(pulse,1);
  ctx.fillStyle="#9b6821";ctx.beginPath();ctx.arc(0,0,c.r+3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#e7b94d";ctx.beginPath();ctx.arc(0,-2,c.r-1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#fff0a1";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-2,c.r-5,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle="#7d5420";ctx.font="800 11px serif";ctx.textAlign="center";ctx.fillText("I",0,2);ctx.textAlign="start";ctx.restore();
}
function drawMountedEnemy(e){
  const sx=e.x-cameraX;if(sx<-160||sx>W+160)return;
  ctx.save();ctx.translate(sx+e.w/2,e.y+e.h/2);ctx.scale(e.facing||1,1);

  if(e.ai==="windup"){
    const pulse=.5+.5*Math.sin(elapsed*18);
    ctx.strokeStyle=`rgba(178,45,45,${.45+pulse*.45})`;ctx.lineWidth=5;
    ctx.beginPath();ctx.ellipse(0,13,60+pulse*8,39+pulse*5,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#8b2632";ctx.beginPath();ctx.arc(0,-91,15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffe8a3";ctx.font="900 20px serif";ctx.textAlign="center";ctx.fillText("!",0,-84);ctx.textAlign="start";
  }
  if(e.ai==="charge"){
    ctx.strokeStyle="#ead9b3";ctx.lineWidth=4;ctx.globalAlpha=.72;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-55-i*13,17+i*10);ctx.lineTo(-94-i*20,17+i*10);ctx.stroke();}
    ctx.globalAlpha=1;
  }

  if(mountedBarbarian.complete&&mountedBarbarian.naturalWidth){
    const frameW=mountedBarbarian.naturalWidth/6;
    const sourceY=130,sourceH=480;
    const rate=e.ai==="charge"?18:e.ai==="patrol"?7:0;
    const frame=rate?Math.floor(elapsed*rate)%6:0;
    const drawH=116,drawW=frameW/sourceH*drawH*1.18;
    if(e.hitFlash>0){ctx.globalAlpha=.55+.45*Math.sin(elapsed*70);}
    ctx.drawImage(mountedBarbarian,frame*frameW,sourceY,frameW,sourceH,-drawW/2,e.h/2-drawH,drawW,drawH);
    ctx.globalAlpha=1;
  }else{
    ctx.fillStyle="#754630";ctx.beginPath();ctx.ellipse(0,12,48,27,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#477345";ctx.fillRect(-10,-42,24,50);
  }
  ctx.restore();

  const barW=86,barX=sx+(e.w-barW)/2,barY=e.y-45;
  roundRect(barX-3,barY-3,barW+6,14,6,"#2a1712d9");
  roundRect(barX,barY,barW,8,4,"#5b4037");
  const hpW=barW*Math.max(0,e.hp/e.maxHp);
  if(hpW>0)roundRect(barX,barY,hpW,8,4,e.hp/e.maxHp>.5?"#d4aa50":"#b7373f");
}
function drawJavelinEnemy(e){
  const x=e.x-cameraX;if(x<-120||x>W+120)return;
  ctx.save();ctx.translate(x+e.w/2,e.y+e.h);ctx.scale(e.facing||1,1);
  if(javelinBarbarian.complete&&javelinBarbarian.naturalWidth){
    const frameW=javelinBarbarian.naturalWidth/6,frameH=javelinBarbarian.naturalHeight/2;
    const throwing=e.ai==="throw";
    const row=throwing?1:0;
    const progress=throwing?Math.max(0,Math.min(1,1-e.stateTimer/.78)):0;
    const frame=throwing?Math.min(5,Math.floor(progress*6)):Math.floor(elapsed*8)%6;
    const drawH=132,drawW=frameW/frameH*drawH;
    ctx.drawImage(javelinBarbarian,frame*frameW,row*frameH,frameW,frameH,-drawW/2,-drawH+4,drawW,drawH);
  }else{
    roundRect(-18,-55,36,52,7,"#477345");
    ctx.strokeStyle="#6d4429";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,-30);ctx.lineTo(35,-75);ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(e){
  if(!e.alive)return;
  if(e.type==="mounted"){drawMountedEnemy(e);return;}
  if(e.type==="javelin"){drawJavelinEnemy(e);return;}
  const x=e.x-cameraX;if(x<-90||x>W+90)return;
  const facing=e.vx>=0?1:-1;
  ctx.save();ctx.translate(x+e.w/2,e.y+e.h);ctx.scale(facing,1);
  if(barbarianWalk.complete&&barbarianWalk.naturalWidth){
    const frameW=barbarianWalk.naturalWidth/6;
    const frame=(Math.floor(elapsed*8)+Math.floor(e.x/120))%6;
    const drawH=112,drawW=frameW/barbarianWalk.naturalHeight*drawH;
    ctx.drawImage(barbarianWalk,frame*frameW,0,frameW,barbarianWalk.naturalHeight,-drawW/2,-drawH,drawW,drawH);
  }else{
    roundRect(-18,-48,36,45,7,"#477345");
    ctx.fillStyle="#dfad72";ctx.beginPath();ctx.arc(0,-63,14,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}
function drawPlayer(){
  if(player.invulnerable>0&&Math.floor(player.invulnerable*12)%2===0)return;
  const x=player.x-cameraX;
  const moving=player.grounded&&Math.abs(player.vx)>22;
  const attackProgress=player.attackTimer>0?1-player.attackTimer/.28:0;
  let row=1,frame=0;
  if(player.shieldRetractTimer>0){
    row=2;frame=5;
  }else if(player.blocking){
    row=2;
    if(player.shieldImpactTimer>0)frame=4;
    else if(player.shieldRaiseTimer>0){
      const raiseProgress=1-player.shieldRaiseTimer/.3;
      frame=raiseProgress<.5?1:2;
    }else frame=3;
  }else if(player.attackTimer>0){
    row=1;frame=Math.min(5,Math.floor(attackProgress*6));
  }else if(moving){
    row=0;frame=Math.floor(elapsed*10)%6;
  }

  ctx.save();ctx.translate(x+player.w/2,player.y+player.h/2);ctx.scale(player.facing,1);
  if(romanHero.complete&&romanHero.naturalWidth){
    const frameW=romanHero.naturalWidth/6;
    const frameH=romanHero.naturalHeight/3;
    const drawH=143,drawW=frameW/frameH*drawH;
    ctx.drawImage(romanHero,frame*frameW,row*frameH,frameW,frameH,-drawW/2,player.h/2-drawH,drawW,drawH);
  }else{
    roundRect(-17,-22,34,55,8,"#8b2632");
    ctx.fillStyle="#d1a44d";ctx.beginPath();ctx.arc(0,-40,17,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#b12d38";ctx.fillRect(-12,-60,24,10);
  }

  ctx.restore();
}
function drawFinish() {
  const x=5020-cameraX;if(x<-150||x>W+150)return;
  ctx.fillStyle="#d9cfbb";ctx.fillRect(x-7,252,18,338);
  ctx.fillStyle="#f2ecdf";ctx.fillRect(x-12,252,8,338);
  ctx.fillStyle="#b68b40";ctx.fillRect(x-19,252,42,10);ctx.fillRect(x-22,580,48,10);
  ctx.fillStyle="#d4aa50";ctx.beginPath();ctx.arc(x+2,239,16,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#6f1d24";ctx.fillRect(x+11,278,115,82);
  ctx.fillStyle="#8e2933";ctx.beginPath();ctx.moveTo(x+126,278);ctx.lineTo(x+142,319);ctx.lineTo(x+126,360);ctx.fill();
  ctx.fillStyle="#efd78d";ctx.font="800 17px serif";ctx.textAlign="center";ctx.fillText("SPQR",x+69,314);
  ctx.font="700 12px serif";ctx.fillText("ROMA",x+69,337);ctx.textAlign="start";
  ctx.strokeStyle="#d4aa50";ctx.lineWidth=3;ctx.strokeRect(x+18,285,101,68);
}
function drawHUD() {
  roundRect(28,24,220,60,16,"#3b211ddf");
  ctx.fillStyle="#d4aa50";ctx.beginPath();ctx.arc(59,54,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#6b431c";ctx.font="800 11px serif";ctx.textAlign="center";ctx.fillText("I",59,58);ctx.textAlign="start";
  ctx.fillStyle="#fff8e8";ctx.font="800 17px DM Sans";ctx.fillText(String(player.coins).padStart(2,"0"),82,61);
  ctx.fillStyle="#806153";ctx.fillRect(127,39,1,30);
  ctx.fillStyle="#b83a42";ctx.font="700 21px DM Sans";ctx.fillText("♥".repeat(Math.max(0,player.lives)),146,62);
  roundRect(W-160,24,132,60,16,"#3b211ddf");ctx.fillStyle="#c2aa96";ctx.font="700 10px DM Sans";ctx.fillText("TEMPUS",W-139,48);
  ctx.fillStyle="#fff8e8";ctx.font="800 17px DM Sans";ctx.fillText(String(Math.floor(elapsed)).padStart(3,"0"),W-88,62);

  roundRect(28,94,220,38,11,"#3b211ddf");
  ctx.fillStyle="#c2aa96";ctx.font="700 10px DM Sans";ctx.fillText("SCUTUM",43,118);
  if(player.shieldCooldown>0){
    ctx.fillStyle="#d85b60";ctx.font="800 13px DM Sans";ctx.fillText(`RECOVER ${player.shieldCooldown.toFixed(1)}s`,105,119);
  }else{
    for(let i=0;i<4;i++){
      const available=i<4-player.shieldHits;
      roundRect(105+i*29,106,21,12,4,available?"#d4aa50":"#5b4037");
    }
  }
}

function drawProjectiles(){
  for(const j of projectiles){
    const x=j.x-cameraX;if(x<-80||x>W+80)continue;
    ctx.save();ctx.translate(x,j.y);ctx.rotate(j.angle);
    ctx.strokeStyle="#243a6a";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(21,0);ctx.stroke();
    ctx.strokeStyle="#7c4b2d";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(22,0);ctx.stroke();
    ctx.fillStyle="#b9c4c6";ctx.strokeStyle="#243a6a";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(34,-6);ctx.lineTo(31,0);ctx.lineTo(34,6);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
  }
}
function draw() {
  drawBackground();
  for(const b of bushes)drawBush(b);
  for(const p of platforms)drawPlatform(p);
  drawFinish();
  for(const c of coins)drawCoin(c);
  for(const e of enemies)drawEnemy(e);
  drawProjectiles();
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-cameraX,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  drawPlayer(); drawHUD();
}

function loop(t) {
  const dt=Math.min(.025,(t-lastTime)/1000||0);lastTime=t;update(dt);draw();requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);












