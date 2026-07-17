(() => {
  "use strict";
  const G=window.RS,canvas=document.getElementById("game"),ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  const image=src=>{const i=new Image();i.src=src;return i};
  const art={
    hero:image("assets/hero-roman-v4.png"),heroSilver:image("assets/hero-roman-silver-v1.png"),heroDiamond:image("assets/hero-roman-diamond-v1.png"),heroSilverDiamond:image("assets/hero-roman-silver-diamond-v1.png"),sword:image("assets/characters/enemies/assembled/barbarian-sword-clean.png"),
    heroMotions:{
      "bronze:gladius":image("assets/characters/roman/motions/bronze-gladius-jump-vault-v1.png"),
      "silver:gladius":image("assets/characters/roman/motions/silver-gladius-jump-vault-v1.png"),
      "bronze:diamond":image("assets/characters/roman/motions/bronze-diamond-jump-vault-v1.png"),
      "silver:diamond":image("assets/characters/roman/motions/silver-diamond-jump-vault-v1.png"),
      "bronze:master":image("assets/characters/roman/motions/bronze-master-jump-vault-v1.png"),
      "silver:master":image("assets/characters/roman/motions/silver-master-jump-vault-v1.png")
    },
    mounted:image("assets/characters/enemies/assembled/barbarian-mounted-clean.png"),javelin:image("assets/characters/enemies/assembled/barbarian-javelin-clean.png"),
    gladiator:image("assets/characters/enemies/assembled/gladiator-clean.png"),elephant:image("assets/war-elephant-v1.png"),miniElephant:image("assets/mini-elephant-v2.png"),tower:image("assets/stone-javelin-tower-v1.png"),
    platform:image("assets/platform-roman-v1.png"),stone:image("assets/stone-photo-v1.png"),
    climb:image("assets/hero-climb-v1.png"),climbSilver:image("assets/hero-climb-silver-v1.png"),
    shop:image("assets/roman-shop-v1.png"),
    bush:image("assets/bush-drawn-v1.png"),
    caesar:image("assets/caesar-statue-v1.png"),aqueduct:image("assets/roman-aqueduct-v1.png"),
    hills:[image("assets/hill-rolling-v1.png"),image("assets/hill-rocky-v1.png"),image("assets/hill-coastal-v1.png"),image("assets/hill-saddle-v1.png"),image("assets/hill-berm-v1.png")],
    trees:[image("assets/tree-umbrella-pine-v1.png"),image("assets/tree-cypress-cluster-v1.png"),image("assets/tree-olive-v1.png"),image("assets/tree-child-cypress-v1.png")],
    halls:[image("assets/antiquity-hall-marble-v1.png"),image("assets/antiquity-hall-gallery-v1.png")],
    banana:image("assets/banana-health-v2.png"),
    pet:image("assets/flower-salamander-sheet-v1.png"),chicken:image("assets/chicken-pet-sheet-v1.png"),chickenJockey:image("assets/chicken-jockey-v2.png"),
    mosaics:[
      image("assets/mosaic-ground-earth.png"),
      image("assets/mosaic-ground-sea.png"),
      image("assets/mosaic-ground-bold.png")
    ]
  };
  const equipmentManifest=window.ROMAN_EQUIPMENT_MANIFEST;
  const enemySpriteMeta=window.ENEMY_SPRITE_MANIFEST?.sprites||{};
  const equipmentImages=new Map([
    ["assets/hero-roman-v4.png",art.hero],
    ["assets/hero-roman-silver-v1.png",art.heroSilver],
    ["assets/hero-roman-diamond-v1.png",art.heroDiamond],
    ["assets/hero-roman-silver-diamond-v1.png",art.heroSilverDiamond]
  ]),equipmentSheetCache=new Map();
  const equipmentImage=path=>{if(!equipmentImages.has(path))equipmentImages.set(path,image(path));return equipmentImages.get(path)};
  function validateEquipmentManifest(){
    const errors=[],grid=equipmentManifest?.grid;if(!grid)return["Equipment manifest is missing."];
    const checkRect=(weapon,label,entry)=>{const [x,y,w,h]=entry.rect;if(x<0||y<0||w<0||h<0||x+w>grid.cellWidth||y+h>grid.cellHeight)errors.push(`${weapon} ${label} crosses a frame boundary`)};
    for(const [weaponId,weapon] of Object.entries(equipmentManifest.weapons||{})){
      for(const patch of weapon.patches||[]){checkRect(weaponId,`patch ${patch.row}:${patch.frame}`,patch);if(patch.sourceRect)checkRect(weaponId,`source ${patch.row}:${patch.frame}`,{rect:patch.sourceRect});if(patch.clearRect)checkRect(weaponId,`clear ${patch.row}:${patch.frame}`,{rect:patch.clearRect})}
      for(const cleanup of weapon.cleanup||[])checkRect(weaponId,`cleanup ${cleanup.row}:${cleanup.frame}`,cleanup);
    }
    return errors;
  }
  function buildEquipmentSheet(armorId,weaponId){
    const armor=equipmentManifest.armors[armorId]||equipmentManifest.armors.bronze,base=equipmentImage(armor.canonical),weapon=equipmentManifest.weapons[weaponId]||equipmentManifest.weapons.gladius;
    if(weapon.composition==="canonical"||!base.complete||!base.naturalWidth)return base;
    const assembledPath=weapon.outputsByArmor?.[armorId],assembled=assembledPath&&equipmentImage(assembledPath);if(assembled?.complete&&assembled.naturalWidth)return assembled;if(weapon.composition==="layered")return base;
    const key=`${armorId}:${weaponId}`;if(equipmentSheetCache.has(key))return equipmentSheetCache.get(key);
    const patchPath=weapon.sourcesByArmor?.[armorId],patchSource=patchPath&&equipmentImage(patchPath);if(!patchSource?.complete||!patchSource.naturalWidth)return base;
    const {columns,rows,cellWidth,cellHeight}=equipmentManifest.grid,c=document.createElement("canvas"),cc=c.getContext("2d");c.width=columns*cellWidth;c.height=rows*cellHeight;cc.drawImage(base,0,0);
    for(const cleanup of weapon.cleanup||[]){const [x,y,w,h]=cleanup.rect;cc.clearRect(cleanup.frame*cellWidth+x,cleanup.row*cellHeight+y,w,h)}
    for(const patch of weapon.patches||[]){
      const [x,y,w,h]=patch.rect,[sx,sy,sw,sh]=patch.sourceRect||patch.rect,[cx0,cy0,cw,ch]=patch.clearRect||patch.rect,ox=patch.frame*cellWidth,oy=patch.row*cellHeight;
      cc.clearRect(ox+cx0,oy+cy0,cw,ch);cc.save();
      if(patch.taperRight){cc.beginPath();cc.moveTo(ox+x,oy+y);cc.lineTo(ox+x+w-12,oy+y);cc.lineTo(ox+x+w,oy+y+h/2);cc.lineTo(ox+x+w-12,oy+y+h);cc.lineTo(ox+x,oy+y+h);cc.closePath();cc.clip()}
      cc.drawImage(patchSource,ox+sx,oy+sy,sw,sh,ox+x,oy+y,w,h);cc.restore();
    }
    const output=new Image();output.src=c.toDataURL("image/png");equipmentSheetCache.set(key,output);return output;
  }
  function heroArtFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",preferred=buildEquipmentSheet(armor,weapon),fallback=buildEquipmentSheet(armor,"gladius");
    return preferred.complete&&preferred.naturalWidth?preferred:fallback.complete&&fallback.naturalWidth?fallback:art.hero;
  }
  function heroEquipmentSprite(img,row,frame,centerX,ground,bodyWidth,bodyHeight,flip=false,alpha=1,trimTop=0,bottom){
    const sourceCellWidth=equipmentManifest.grid.cellWidth,actualCellWidth=img.naturalWidth/6||sourceCellWidth,drawWidth=bodyWidth*actualCellWidth/sourceCellWidth;
    return anchoredSheet(img,6,4,row,frame,centerX-drawWidth/2,ground,drawWidth,bodyHeight,flip,alpha,trimTop,bottom);
  }
  function heroMotionSprite(img,row,frame,centerX,ground,bodyWidth,bodyHeight,flip=false,bottom=246){
    const sourceCellWidth=equipmentManifest.motionSheets?.grid?.cellWidth||equipmentManifest.grid.cellWidth,actualCellWidth=img.naturalWidth/6||sourceCellWidth,drawWidth=bodyWidth*actualCellWidth/sourceCellWidth;
    return anchoredSheet(img,6,2,row,frame,centerX-drawWidth/2,ground,drawWidth,bodyHeight,flip,1,0,bottom);
  }
  function heroMotionArtFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",preferred=art.heroMotions[`${armor}:${weapon}`],fallback=art.heroMotions[`${armor}:gladius`];
    return preferred?.complete&&preferred.naturalWidth?preferred:fallback?.complete&&fallback.naturalWidth?fallback:null;
  }
  function heroMotionFlipFor(p){
    const armor=p.silverArmor?"silver":"bronze",weapon=p.weapon==="master"&&p.hasMasterDiamondSword?"master":p.weapon==="diamond"&&p.hasDiamondSword?"diamond":"gladius",sourceFacing=equipmentManifest.motionSheets?.sourceFacingByArmorAndWeapon?.[armor]?.[weapon]||equipmentManifest.motionSheets?.sourceFacingByArmor?.[armor]||"right";
    return sourceFacing==="left"?p.facing>0:p.facing<0;
  }
  const equipmentManifestErrors=validateEquipmentManifest();if(equipmentManifestErrors.length)console.warn("Equipment manifest:",equipmentManifestErrors);
  window.RS_EQUIPMENT_DEBUG={manifest:equipmentManifest,validate:validateEquipmentManifest,cache:equipmentSheetCache,getSheet:buildEquipmentSheet};
  const hillMasks=[];
  const spriteBottoms={
    hero:[[256,256,256,256,256,256],[256,256,256,256,256,256],[253,253,253,253,253,253],[242,242,242,243,242,242]],
    sword:[[418,420,421,422,421,422],[392,390,391,389,388,389]],
    javelin:[[396,397,397,396,395,396],[380,380,380,377,377,379]],
    gladiator:[[308,308,307,308,308,309],[300,299,299,299,299,300],[290,290,290,291,290,291]],
    elephant:[[241,239,242,244,242,241],[207,209,210,256,216,219],[217,256,256,213,210,211],[210,196,210,213,225,212]],
    climb:[[445,445,445,445,445,445],[453,454,401,401,392,402]]
  };
  function anchoredSheet(img,cols,rows,row,frame,x,ground,w,h,flip=false,alpha=1,trimTop=0,bottom){
    const cellH=img.naturalHeight/rows,visibleBottom=bottom??cellH,y=ground-h*visibleBottom/cellH;
    return sheet(img,cols,rows,row,frame,x,y,w,h,flip,alpha,trimTop);
  }
  function enemySheetWidth(key,img,cols,bodyWidth){
    const actualCellWidth=img.naturalWidth/cols,logicalCellWidth=enemySpriteMeta[key]?.logicalCellWidth||actualCellWidth;
    return bodyWidth*actualCellWidth/logicalCellWidth;
  }
  const elephantFrames=[
    [[17,17,256,241],[18,18,239,239],[1,19,241,242],[6,21,234,243],[0,19,225,242],[0,17,224,241]],
    [[14,26,256,207],[1,27,256,209],[0,30,249,210],[6,29,252,215],[4,31,224,216],[0,29,221,219]],
    [[16,12,255,217],[13,13,256,211],[25,15,253,212],[25,0,251,212],[3,13,223,210],[0,12,216,211]],
    [[15,10,254,210],[45,0,251,196],[52,0,246,210],[33,19,251,208],[0,28,238,224],[0,14,224,212]]
  ];
  function elephantSprite(b,row,frame,alpha=1){
    const img=art.elephant;if(!img.complete||!img.naturalWidth)return;const cellW=img.naturalWidth/6,cellH=img.naturalHeight/4,box=elephantFrames[row][frame],scale=1.5;
    const sw=box[2]-box[0],sh=box[3]-box[1],dw=sw*scale,dh=sh*scale,x=G.cx(b)-dw/2,y=b.y+b.h-dh;
    ctx.save();ctx.globalAlpha=alpha;if(b.facing>0){ctx.translate(G.cx(b)*2,0);ctx.scale(-1,1)}ctx.drawImage(img,frame*cellW+box[0],row*cellH+box[1],sw,sh,x,y,dw,dh);ctx.restore();
  }
  const miniElephantMeta=window.MINI_ELEPHANT_MANIFEST;
  function miniElephantSprite(e,row,frame,alpha=1){
    const img=art.miniElephant;if(!img.complete||!img.naturalWidth)return;const cellW=img.naturalWidth/6,cellH=img.naturalHeight/4,scale=.975/miniElephantMeta.rowScales[row],dw=cellW*scale,dh=cellH*scale,x=G.cx(e)-dw/2,y=e.y+e.h-miniElephantMeta.bottoms[row][frame]*scale;
    ctx.save();ctx.globalAlpha=alpha;if(e.dir>0){ctx.translate(G.cx(e)*2,0);ctx.scale(-1,1)}ctx.drawImage(img,frame*cellW,row*cellH,cellW,cellH,x,y,dw,dh);ctx.restore();
  }
  function mountedSprite(e,frame){
    const img=art.mounted;if(!img.complete||!img.naturalWidth)return;const frameW=img.naturalWidth/6,sourceY=130,sourceH=480,drawH=134,drawW=frameW/sourceH*drawH*1.18;
    const visibleBottom=[434,435,438,438,441,417][frame],x=G.cx(e)-drawW/2,y=e.y+e.h-drawH*visibleBottom/sourceH;
    ctx.save();if(e.dir<0){ctx.translate(G.cx(e)*2,0);ctx.scale(-1,1)}ctx.drawImage(img,frame*frameW,sourceY,frameW,sourceH,x,y,drawW,drawH);ctx.restore();
  }
  const rough=(x1,y1,x2,y2,color="#263b76",width=2,seed=0)=>{
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";
    for(let p=0;p<2;p++){const j=Math.sin(seed*12.91+p*7.3)*1.7;ctx.beginPath();ctx.moveTo(x1+j,y1-j*.4);ctx.quadraticCurveTo((x1+x2)/2+Math.sin(seed+p)*2.5,(y1+y2)/2+Math.cos(seed*2+p)*2.2,x2-j*.3,y2+j);ctx.stroke()}
  };
  function sheet(img,cols,rows,row,frame,x,y,w,h,flip=false,alpha=1,trimTop=0){
    if(!img.complete||!img.naturalWidth)return false;const sw=img.naturalWidth/cols,sh=img.naturalHeight/rows,srcH=sh-trimTop,drawH=h*srcH/sh,drawY=y+h-drawH;
    ctx.save();ctx.globalAlpha=alpha;
    if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(img,frame*sw,row*sh+trimTop,sw,srcH,0,drawY,w,drawH)}
    else ctx.drawImage(img,frame*sw,row*sh+trimTop,sw,srcH,x,drawY,w,drawH);
    ctx.restore();return true;
  }
  let localClock;
  const mixColor=(a,b,t)=>{const n=s=>parseInt(s,16),ar=n(a.slice(1,3)),ag=n(a.slice(3,5)),ab=n(a.slice(5,7)),br=n(b.slice(1,3)),bg=n(b.slice(3,5)),bb=n(b.slice(5,7)),h=v=>Math.round(v).toString(16).padStart(2,"0");return"#"+h(ar+(br-ar)*t)+h(ag+(bg-ag)*t)+h(ab+(bb-ab)*t)};
  function readLocalClock(){
    if(!G.creative.active||!G.creative.dayNightCycle)return{day:true,progress:.5,elevation:1,daylight:1,label:"12:00",cycling:false};
    const cycleSeconds=600,phase=(G.elapsed%cycleSeconds)/cycleSeconds,hour=(6+phase*24)%24,day=hour>=6&&hour<18;
    const progress=day?(hour-6)/12:(hour>=18?(hour-18)/12:(hour+6)/12),elevation=Math.sin(progress*Math.PI),daylight=day?.32+.68*elevation:0;
    const hh=Math.floor(hour),mm=Math.floor((hour-hh)*60),label=String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0");
    return{day,progress,elevation,daylight,label,cycling:true};
  }
  const indoorZones=[{start:1900,end:3500,hall:0},{start:4750,end:6400,hall:1}];
  function interiorState(){
    if(G.levelIndex!==3)return{blend:0,hall:0,start:0,end:0};
    const zoom=G.level.zoom||1,center=G.camera+W/(zoom*2),edge=300,smooth=t=>t*t*(3-2*t);let best={blend:0,hall:0,start:0,end:0};
    for(const zone of indoorZones){const raw=Math.min((center-(zone.start-edge))/edge,((zone.end+edge)-center)/edge),blend=smooth(G.clamp(raw,0,1));if(blend>best.blend)best={...zone,blend}}
    return best;
  }
  function warpedMosaic(img,x,y,w,h,alpha){
    if(!img.complete||!img.naturalWidth||alpha<=0)return;const slices=34,inset=w*.13,sx=img.naturalWidth*.025,sy=img.naturalHeight*.06,sw=img.naturalWidth*.95,sh=img.naturalHeight*.86;
    ctx.save();ctx.globalAlpha=alpha;
    for(let n=0;n<slices;n++){const t0=n/slices,t1=(n+1)/slices,xt0=x+inset+(w-inset*2)*t0,xt1=x+inset+(w-inset*2)*t1,xb0=x+w*t0,xb1=x+w*t1,minX=Math.min(xt0,xb0),maxX=Math.max(xt1,xb1);ctx.save();ctx.beginPath();ctx.moveTo(xt0,y);ctx.lineTo(xt1,y);ctx.lineTo(xb1,y+h);ctx.lineTo(xb0,y+h);ctx.closePath();ctx.clip();ctx.drawImage(img,sx+sw*t0,sy,sw/slices+.7,sh,minX,y,maxX-minX,h);ctx.restore()}
    ctx.restore();
  }  function sky(){
    const palettes=[["#f5d994","#83b5c8","#e49b67"],["#edc57c","#749cae","#bc745d"],["#db9a69","#704f69","#562d36"],["#d7ae69","#6f8798","#9f594d"],["#e2c47d","#7298aa","#a96d55"],["#ead18c","#668aa3","#9f6757"]],pal=palettes[G.levelIndex%palettes.length];
    const t=localClock.daylight,top=mixColor("#09132f",pal[1],t),mid=mixColor("#1b2b55",pal[0],t),bottom=mixColor("#493a58",pal[2],t);
    const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,top);gr.addColorStop(.6,mid);gr.addColorStop(1,bottom);ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
    const starAlpha=localClock.day?Math.max(0,.45-t)*1.4:.78;
    if(starAlpha>0){ctx.save();ctx.globalAlpha=starAlpha;ctx.fillStyle="#fff4c7";for(let i=0;i<58;i++){const x=(i*193+Math.sin(i*8.7)*91+W)%W,y=18+(i*71)%285,r=i%9===0?2.1:1.15;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}ctx.restore()}
    ctx.globalAlpha=.06+.08*t;ctx.strokeStyle="#fff7d2";ctx.lineWidth=7;
    for(let i=0;i<24;i++){const y=18+i*24+Math.sin(i*2.4)*6;ctx.beginPath();ctx.moveTo(-20,y);ctx.quadraticCurveTo(W*.48,y+Math.sin(i)*15,W+20,y-4);ctx.stroke()}
    ctx.globalAlpha=1;const x=75+localClock.progress*(W-150),y=230-localClock.elevation*155;
    if(localClock.day){ctx.fillStyle="#f3c65d";ctx.beginPath();ctx.arc(x,y,48,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#ffe9a0";ctx.lineWidth=4;ctx.stroke()}
    else{ctx.fillStyle="#f5edcf";ctx.beginPath();ctx.arc(x,y,39,0,Math.PI*2);ctx.fill();ctx.fillStyle=top;ctx.beginPath();ctx.arc(x+15,y-10,34,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d6d9dd";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,39,0,Math.PI*2);ctx.stroke()}
  }
  function backdrop(){
    const boss=G.levelIndex===2,aqueduct=art.aqueduct;
    const hillCrop=[[.005,.47,.99,.515],[.005,.075,.99,.855],[.005,.275,.99,.71],[0,.565,1,.29],[0,.518,1,.35]];
    const treeCrop=[[.05,.075,.90,.86],[.25,.04,.52,.92],[.25,.055,.53,.865],[.37,.12,.26,.77]];
    const farSets=[[0,1,3,0,2],[1,3,0,1,2],[1,1,3,0,2],[2,3,0,1,0],[0,2,3,0,1]];
    const nearSets=[[3,0,2,3,0],[2,3,0,3,2],[3,1,0,3,0],[2,3,3,0,2],[0,3,2,0,3]];
    const treeSets=[[0,3,2,1,3,0],[1,2,3,0,2,3],[2,3,1,2,0,3],[0,2,3,1,2,3],[3,0,2,1,3,0]];
    const drawHill=(kind,x,y,w,h,alpha,flip=false,feather=true)=>{
      const img=art.hills[kind];if(!img.complete||!img.naturalWidth)return;
      const c=hillCrop[kind],sx=img.naturalWidth*c[0],sy=img.naturalHeight*c[1],sw=img.naturalWidth*c[2],sh=img.naturalHeight*c[3];let source=img,sourceArgs=[sx,sy,sw,sh];
      if(feather){
        if(!hillMasks[kind]){const mask=document.createElement("canvas");mask.width=900;mask.height=300;const mc=mask.getContext("2d");mc.drawImage(img,sx,sy,sw,sh,0,0,mask.width,mask.height);mc.globalCompositeOperation="destination-in";const fade=mc.createLinearGradient(0,0,mask.width,0);fade.addColorStop(0,"#0000");fade.addColorStop(.13,"#000");fade.addColorStop(.87,"#000");fade.addColorStop(1,"#0000");mc.fillStyle=fade;mc.fillRect(0,0,mask.width,mask.height);hillMasks[kind]=mask}source=hillMasks[kind];sourceArgs=[0,0,source.width,source.height];
      }
      ctx.save();ctx.globalAlpha=alpha;if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(source,...sourceArgs,0,y,w,h)}else ctx.drawImage(source,...sourceArgs,x,y,w,h);ctx.restore();
    };
    const drawTree=(kind,x,base,w,h,alpha,flip=false)=>{
      const img=art.trees[kind];if(!img.complete||!img.naturalWidth)return;
      const c=treeCrop[kind],sx=img.naturalWidth*c[0],sy=img.naturalHeight*c[1],sw=img.naturalWidth*c[2],sh=img.naturalHeight*c[3],y=base-h;
      ctx.save();ctx.globalAlpha=alpha;if(flip){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(img,sx,sy,sw,sh,0,y,w,h)}else ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);ctx.restore();
    };

    ctx.save();ctx.translate(G.camera*.46,0);

    const far=farSets[G.levelIndex%farSets.length],farOffset=-620-G.levelIndex*137;
    for(let i=0,x=farOffset;x<G.level.width+1100;i++,x+=625){
      const kind=far[i%far.length],rocky=kind===1,w=rocky?900:835,h=rocky?270:kind===2?230:kind===3?150:185;
      drawHill(kind,x,505-h,w,h,boss?.34:.46,(i+G.levelIndex)%2===1);
    }
    ctx.restore();

    ctx.save();ctx.translate(G.camera*.17,0);
    const aqueductScale=[.52,.48,.50,.46,.48][G.levelIndex%5],supportW=640,supportH=112;
    for(let i=0,x=80-G.levelIndex*137;x<G.level.width+800;i++,x+=1120){
      const scale=aqueductScale*(i%3===1?.94:1),base=452+(i%2)*10,aqW=710*scale,aqH=245*scale,aqX=x+(supportW-aqW)/2;
      if(aqueduct.complete&&aqueduct.naturalWidth){
        ctx.globalAlpha=boss?.62:.82;ctx.drawImage(aqueduct,aqueduct.naturalWidth*.015,aqueduct.naturalHeight*.1,aqueduct.naturalWidth*.97,aqueduct.naturalHeight*.79,aqX,base-aqH,aqW,aqH);
        drawHill(4,x,base-19,supportW,supportH,boss?.82:1,i%2===1,true);
      }
    }
    ctx.restore();
    ctx.save();ctx.translate(G.camera*.07,0);

    const trees=treeSets[G.levelIndex%treeSets.length],treeOffset=-140+G.levelIndex*91;
    for(let i=0,x=treeOffset;x<G.level.width+700;i++,x+=470){
      const kind=trees[i%trees.length],h=kind===0?142:kind===1?130:kind===3?138:112,w=kind===0?112:kind===1?78:kind===3?50:122,base=430+Math.sin(i*2.17+G.levelIndex)*8;
      drawTree(kind,x,base,w,h,boss?.50:.72,(i+G.levelIndex)%2===1);
    }
    const near=nearSets[G.levelIndex%nearSets.length],nearOffset=-520-G.levelIndex*83;
    for(let i=0,x=nearOffset;x<G.level.width+900;i++,x+=520){
      const kind=near[i%near.length],coastal=kind===2,w=coastal?780:kind===3?760:745,h=coastal?205:kind===3?150:190,y=coastal?390:kind===3?407:405;
      drawHill(kind,x,y+Math.sin(i*1.9+G.levelIndex)*5,w,h,boss?.68:.90,(i*3+G.levelIndex)%2===1);
    }
    ctx.restore();
    const interior=interiorState(),hall=art.halls[interior.hall];
    if(interior.blend>0&&hall.complete&&hall.naturalWidth){
      const zoom=G.level.zoom||1,viewW=W/zoom,viewTop=H-H/zoom,viewH=H/zoom,drift=(G.camera-interior.start)*.028,dx=G.camera-52/zoom-drift;
      ctx.save();ctx.globalAlpha=interior.blend;ctx.drawImage(hall,dx,viewTop,viewW+104/zoom,viewH);
      const mosaic=art.mosaics[interior.hall?2:0];warpedMosaic(mosaic,G.camera+74/zoom-drift*.35,452,viewW-148/zoom,138,interior.blend*.58);
      if(mosaic.complete&&mosaic.naturalWidth){ctx.globalAlpha=interior.blend*.30;for(const px of [.23,.67]){const wx=G.camera+viewW*px-drift*.5;ctx.fillStyle="#6b3a3b";ctx.fillRect(wx-7,270,174,111);ctx.drawImage(mosaic,mosaic.naturalWidth*.08,mosaic.naturalHeight*.09,mosaic.naturalWidth*.84,mosaic.naturalHeight*.78,wx,277,160,97)}}
      ctx.restore();
    }
    ctx.globalAlpha=1;
  }  function bushes(){
    const outdoor=1-interiorState().blend;if(outdoor<=.02)return;ctx.save();ctx.globalAlpha=outdoor;
    const img=art.bush;
    for(let i=0;i<G.level.bushes.length;i++){
      const x=G.level.bushes[i];if(x<G.camera-100||x>G.camera+W/(G.level.zoom||1)+100)continue;
      const ground=G.platforms.find(p=>p.ground&&x>=p.x&&x<=p.x+p.w)?.y??590;
      if(img.complete&&img.naturalWidth){
        const h=92+(i%3)*8,w=h*1.06,y=ground-h,sx=img.naturalWidth*.13,sy=img.naturalHeight*.12,sw=img.naturalWidth*.76,sh=img.naturalHeight*.76;
        ctx.save();
        if(i%2){ctx.translate(x*2,0);ctx.scale(-1,1)}
        ctx.drawImage(img,sx,sy,sw,sh,x-w/2,y,w,h);
        ctx.restore();
      }else{
        ctx.fillStyle=i%3===0?"#3f6249":"#59784b";ctx.beginPath();ctx.ellipse(x,ground-32,38,42,-.2,0,Math.PI*2);ctx.fill();
        rough(x-28,ground-18,x+28,ground-63,"#203f68",2,i);
      }
    }
    ctx.restore();
  }
  function statues(){
    const img=art.caesar;if(!img.complete||!img.naturalWidth)return;
    for(const s of G.level.statues||[]){
      if(s.x+s.w<G.camera-80||s.x>G.camera+W/(G.level.zoom||1)+80)continue;
      const sx=img.naturalWidth*.06,sy=img.naturalHeight*.025,sw=img.naturalWidth*.88,sh=img.naturalHeight*.95;
      ctx.drawImage(img,sx,sy,sw,sh,s.x,s.y,s.w,s.h);
      rough(s.x+9,s.y+s.h-1,s.x+s.w-7,s.y+s.h-1,"#263b76",1.8,s.x*.03);
    }
  }
  function mosaicGround(p,i){
    const mosaicIndex=(G.levelIndex+i)%art.mosaics.length,img=art.mosaics[mosaicIndex];
    if(!img.complete||!img.naturalWidth)return false;
    const crops=[[.060,.145,.880,.720],[.060,.160,.860,.700],[.050,.150,.850,.680]],crop=crops[mosaicIndex];
    const cropX=img.naturalWidth*crop[0],cropY=img.naturalHeight*crop[1],cropW=img.naturalWidth*crop[2],cropH=img.naturalHeight*crop[3];
    const cols=Math.max(10,Math.ceil(p.w/62)),rows=Math.max(3,Math.ceil(p.h/43));
    ctx.save();ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.clip();ctx.fillStyle="#b99768";ctx.fillRect(p.x,p.y,p.w,p.h);
    for(let row=0;row<rows;row++){
      const sy0=cropY+cropH*row/rows,sy1=cropY+cropH*(row+1)/rows;
      const y0=row===0?p.y:p.y+p.h*row/rows+Math.sin(row*2.31+i*.73)*1.6;
      const y1=row===rows-1?p.y+p.h:p.y+p.h*(row+1)/rows+Math.sin((row+1)*2.31+i*.73)*1.6;
      for(let col=0;col<cols;col++){
        const sx0=cropX+cropW*col/cols,sx1=cropX+cropW*(col+1)/cols;
        const base0=p.x+p.w*col/cols,base1=p.x+p.w*(col+1)/cols;
        const skew=Math.sin((row+1)*1.7+col*.83+i)*1.35;
        const x0=col===0?p.x:base0+skew,x1=col===cols-1?p.x+p.w:base1+skew;
        ctx.drawImage(img,sx0,sy0,sx1-sx0+.8,sy1-sy0+.8,x0-.6,y0-.6,x1-x0+1.2,y1-y0+1.2);
      }
    }
    const shade=ctx.createLinearGradient(0,p.y,0,p.y+p.h);shade.addColorStop(0,"#fff6d90d");shade.addColorStop(.72,"#00000000");shade.addColorStop(1,"#4d32152e");ctx.fillStyle=shade;ctx.fillRect(p.x,p.y,p.w,p.h);ctx.restore();
    rough(p.x,p.y+2,p.x+p.w,p.y+2,"#263b76",2.2,i+1);rough(p.x,p.y+p.h-2,p.x+p.w,p.y+p.h-2,"#6f4b35",1.3,i+7);rough(p.x+1,p.y,p.x+1,p.y+p.h,"#263b76",1.3,i+4);rough(p.x+p.w-1,p.y,p.x+p.w-1,p.y+p.h,"#263b76",1.3,i+9);
    return true;
  }  function ladders(){
    for(let i=0;i<G.ladders.length;i++){const l=G.ladders[i];if(l.x+l.w<G.camera-80||l.x>G.camera+W/(G.level.zoom||1)+80)continue;
      rough(l.x+10,l.y,l.x+10,l.y+l.h,"#263b76",8,i+11);rough(l.x+l.w-10,l.y,l.x+l.w-10,l.y+l.h,"#263b76",8,i+19);
      rough(l.x+10,l.y,l.x+10,l.y+l.h,"#8b552f",5,i+13);rough(l.x+l.w-10,l.y,l.x+l.w-10,l.y+l.h,"#8b552f",5,i+23);
      for(let y=l.y+14,n=0;y<l.y+l.h-5;y+=27,n++){rough(l.x+8,y,l.x+l.w-8,y,"#263b76",7,i*10+n);rough(l.x+9,y,l.x+l.w-9,y,"#b7793f",4,i*10+n+2)}
    }
  }

  function platform(p,i){
    if(p.x+p.w<G.camera-80||p.x>G.camera+W/(G.level.zoom||1)+80)return;
    if(p.ground&&mosaicGround(p,i))return;
    const img=art.platform;
    if(img.complete&&img.naturalWidth){
      const artH=G.clamp(p.w*img.naturalHeight/img.naturalWidth,p.ground?80:58,p.ground?104:72);
      if(p.ground){
        ctx.fillStyle="#c9ad78";ctx.fillRect(p.x,p.y+artH*.42,p.w,Math.max(0,p.h-artH*.42));
        for(let x=p.x+24;x<p.x+p.w;x+=86)rough(x,p.y+artH*.7,Math.min(x+44,p.x+p.w),p.y+artH*.7+14,"#9b805e",1,x*.1);
      }
      ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,p.x-2,p.y-3,p.w+4,artH);
      rough(p.x,p.y,p.x+p.w,p.y,"#263b76",1.35,i+2);
      if(p.moving){ctx.fillStyle="#8b2632";ctx.fillRect(p.x+p.w/2-19,p.y+17,38,6);rough(p.x+p.w/2-19,p.y+20,p.x+p.w/2+19,p.y+20,"#263b76",1.5,i)}
      return;
    }
    ctx.fillStyle=p.ground?"#d9c89e":"#ede4cc";ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.fillStyle=p.ground?"#b79b68":"#cfb779";ctx.fillRect(p.x,p.y,p.w,Math.min(12,p.h));
    rough(p.x,p.y+2,p.x+p.w,p.y+2,"#273c78",2.2,i+1);rough(p.x,p.y+11,p.x+p.w,p.y+11,"#8f6537",1.5,i+8);
    rough(p.x+1,p.y,p.x+1,p.y+p.h,"#263b76",2,i+4);rough(p.x+p.w-1,p.y,p.x+p.w-1,p.y+p.h,"#263b76",2,i+7);
    for(let x=p.x+24;x<p.x+p.w-10;x+=72){const y=p.y+22+Math.sin(x*.07+i)*7;rough(x,y,Math.min(x+43,p.x+p.w-6),y+Math.sin(x)*16,"#9aa8a6",1.15,x*.1);if(p.ground&&p.h>60)rough(x+18,p.y+52,x+48,p.y+90,"#b1a58d",1,x)}
    if(p.moving){ctx.fillStyle="#8b2632";ctx.fillRect(p.x+p.w/2-19,p.y+17,38,6);rough(p.x+p.w/2-19,p.y+20,p.x+p.w/2+19,p.y+20,"#263b76",1.5,i)}
  }
  function merchantShop(){
    const s=G.level.shop,img=art.shop;if(!s||!img.complete||!img.naturalWidth)return;
    const sx=img.naturalWidth*.035,sy=img.naturalHeight*.12,sw=img.naturalWidth*.93,sh=img.naturalHeight*.72;
    ctx.drawImage(img,sx,sy,sw,sh,s.x,s.y,s.w,s.h);
    rough(s.x+8,s.y+s.h-1,s.x+s.w-5,s.y+s.h-1,"#263b76",2.2,19+G.levelIndex);
    if(G.shop.near&&!G.shop.open){
      const x=s.x+72,y=s.y-7;
      ctx.fillStyle="#fff8e9ee";ctx.beginPath();ctx.roundRect(x,y,112,38,12);ctx.fill();
      ctx.strokeStyle="#263b76";ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle="#7e202b";ctx.font="800 15px 'Fredoka',sans-serif";ctx.textAlign="center";ctx.fillText("Q · SHOP",x+56,y+25);ctx.textAlign="left";
    }
  }  function collectibles(){
    for(const c of G.coins){if(c.taken)continue;const x=c.x+12,y=c.y+12+Math.sin(c.bob)*4,pulse=.76+Math.abs(Math.sin(G.elapsed*5+c.bob))*.24;ctx.save();ctx.translate(x,y);ctx.scale(pulse,1);ctx.fillStyle="#94611f";ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e3b74b";ctx.beginPath();ctx.arc(0,-2,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#fff0a1";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-2,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#70491e";ctx.font="800 11px serif";ctx.textAlign="center";ctx.fillText("I",0,2);ctx.restore();ctx.textAlign="left"}
    for(const b of G.bananas){if(b.taken)continue;const x=b.x+b.w/2,y=b.y+b.h/2+Math.sin(b.bob)*4;
      ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(G.elapsed*2.8+b.bob)*.07);ctx.fillStyle="#f5d75b22";ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();
      if(art.banana.complete&&art.banana.naturalWidth){const sx=art.banana.naturalWidth*.15,sy=art.banana.naturalHeight*.04,sw=art.banana.naturalWidth*.72,sh=art.banana.naturalHeight*.91;ctx.drawImage(art.banana,sx,sy,sw,sh,-25,-29,50,58)}
      else{ctx.fillStyle="#f0c42e";ctx.beginPath();ctx.ellipse(0,0,13,25,.35,0,Math.PI*2);ctx.fill();rough(-9,-20,10,20,"#263b76",2,b.x)}ctx.restore();
    }
    for(const s of G.stones){if(s.taken)continue;const y=s.y+Math.sin(s.bob)*3;if(art.stone.complete&&art.stone.naturalWidth)ctx.drawImage(art.stone,s.x-4,y-2,33,23);else{ctx.fillStyle="#82796f";ctx.beginPath();ctx.moveTo(s.x,y+15);ctx.lineTo(s.x+6,y+2);ctx.lineTo(s.x+20,y);ctx.lineTo(s.x+25,y+13);ctx.lineTo(s.x+14,y+20);ctx.closePath();ctx.fill();rough(s.x+2,y+15,s.x+21,y+2,"#263b76",1.5,s.x)}}
    if(G.sling&&!G.sling.taken){const x=G.sling.x,y=G.sling.y+Math.sin(G.elapsed*4)*5;rough(x+10,y+4,x+21,y+24,"#6f4428",5,2);rough(x+34,y+4,x+21,y+24,"#6f4428",5,4);rough(x+11,y+4,x+33,y+4,"#c6a66a",2,8);ctx.fillStyle="#f2d26c";ctx.beginPath();ctx.arc(x+21,y+25,5,0,Math.PI*2);ctx.fill()}
  }
  function tutorialCard(x,y,w,title,line1,line2,tailX=null,tailY=null){
    const h=98;ctx.save();ctx.fillStyle="#fff8e9f4";ctx.strokeStyle="#263b76";ctx.lineWidth=2.8;ctx.beginPath();ctx.roundRect(x,y,w,h,15);ctx.fill();ctx.stroke();
    ctx.fillStyle="#7e202b";ctx.font="800 20px 'Fredoka',sans-serif";ctx.fillText(title,x+18,y+30);ctx.fillStyle="#352b30";ctx.font="800 14px 'DM Sans',sans-serif";ctx.fillText(line1,x+18,y+61);ctx.fillStyle="#245f58";ctx.font="800 13px 'DM Sans',sans-serif";ctx.fillText(line2,x+18,y+84);
    ctx.fillStyle="#fff8e9f4";ctx.beginPath();if(tailX!==null&&tailY!==null){ctx.moveTo(x+w-2,y+43);ctx.lineTo(x+w-2,y+70);ctx.lineTo(tailX,tailY)}else{ctx.moveTo(x+w*.46,y+h-2);ctx.lineTo(x+w*.56,y+h-2);ctx.lineTo(x+w*.51,y+h+16)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function tutorialTips(){
    const p=G.player,statue=G.level.statues?.[0];if(G.levelIndex===0&&p.x<900&&statue)tutorialCard(statue.x-465,statue.y-82,420,"CAESAR SAYS","A / D MOVE  -  W JUMP  -  SPACE STAB","S SHIELD  -  W AGAIN: LEDGE GRAB  -  DOWN DESCENDS",statue.x+82,statue.y+48);
    const sling=G.sling;if(sling&&Math.abs(G.cx(p)-(sling.x+21))<600){const owned=sling.taken||p.hasSling;tutorialCard(sling.x-170,sling.y-150,390,owned?"SLING EQUIPPED":"SLINGSHOT AHEAD",owned?"SELECT THE SLING IN THE ITEM BAR":"WALK OVER THE SLING TO PICK IT UP",owned?"PRESS E TO THROW  -  COLLECT STONES":"THEN PRESS E TO THROW STONES")}
  }
  const chickenJockeyFrames=[
    [[66,91,209,329],[347,94,224,313],[628,99,209,318],[897,109,197,314],[1165,105,208,309],[1430,105,197,319]],
    [[70,516,204,313],[317,518,213,316],[548,493,243,338],[844,516,273,319],[1115,530,278,304],[1410,527,189,307]]
  ];
  function chickenJockeySprite(e,frame){
    const img=art.chickenJockey;if(!img.complete||!img.naturalWidth)return;
    const row=["windup","jump"].includes(e.state)?1:0,f=frame%6,box=chickenJockeyFrames[row][f],scale=.38;
    const cellW=img.naturalWidth/6,cellCenter=(f+.5)*cellW,sx=box[0],sy=box[1],sw=box[2],sh=box[3],cx=G.cx(e);
    const x=cx+(sx-cellCenter)*scale,y=e.y+e.h-sh*scale,dw=sw*scale,dh=sh*scale;
    ctx.save();if(e.dir<0){ctx.translate(cx*2,0);ctx.scale(-1,1)}ctx.drawImage(img,sx,sy,sw,sh,x,y,dw,dh);ctx.restore();
  }  function towerThrower(e,x,row,frame){
    const img=art.javelin;if(!img.complete||!img.naturalWidth)return;const cellW=img.naturalWidth/6,cellH=img.naturalHeight/2,sourceH=cellH*.62,dw=enemySheetWidth("javelin",img,6,112),dh=105,y=e.y-72;
    ctx.save();if(e.dir<0){ctx.translate(x*2,0);ctx.scale(-1,1)}ctx.drawImage(img,frame*cellW,row*cellH,cellW,sourceH,x-dw/2,y,dw,dh);ctx.restore();
  }
  function towerSprite(e,frame){
    const throwing=e.state==="throw",row=throwing?1:0,f=throwing?G.clamp(Math.floor((.8-e.timer)/.8*6),0,5):frame;
    towerThrower(e,e.x+49,row,f);towerThrower(e,e.x+141,row,(f+2)%6);
    const img=art.tower;if(img.complete&&img.naturalWidth){const sx=img.naturalWidth*.1436,sy=img.naturalHeight*.1167,sw=img.naturalWidth*.7164,sh=img.naturalHeight*.7756,dw=e.h*sw/sh,x=G.cx(e)-dw/2;ctx.drawImage(img,sx,sy,sw,sh,x,e.y,dw,e.h)}
    else{ctx.fillStyle="#9c927d";ctx.fillRect(e.x,e.y+30,e.w,e.h-30);for(let x=e.x;x<e.x+e.w;x+=48)ctx.fillRect(x,e.y,34,55);rough(e.x,e.y+55,e.x+e.w,e.y+55,"#263b76",3,e.x)}
  }
  function health(e){
    const w=e.type==="tower"?120:e.type==="miniElephant"?105:e.type==="mounted"?72:e.type==="chickenJockey"?66:58,x=G.cx(e)-w/2,y=e.type==="tower"?e.y-105:e.type==="miniElephant"?e.y-22:e.type==="mounted"?e.y-48:e.type==="chickenJockey"?e.y-78:e.type==="gladiator"?e.y-70:e.y-58;ctx.fillStyle="#2b2030";ctx.fillRect(x,y,w,8);ctx.fillStyle="#b82e38";ctx.fillRect(x+2,y+2,(w-4)*e.hp/e.maxHp,4);rough(x,y,x+w,y,"#263b76",1,x);if(e.type==="gladiator"){const pct=e.shieldCooldown>0?1-e.shieldCooldown/5:(4-e.shieldHits)/4;ctx.fillStyle="#2b2030";ctx.fillRect(x,y+11,w,7);ctx.fillStyle=e.shieldCooldown>0?"#a83a3c":"#3e7180";ctx.fillRect(x+2,y+13,(w-4)*G.clamp(pct,0,1),3);for(let i=1;i<4;i++){ctx.fillStyle="#e9d7ad";ctx.fillRect(x+i*w/4,y+11,1,7)}}
  }
  function charge(x,y,w,p){ctx.fillStyle="#38242a";ctx.fillRect(x,y,w,10);ctx.fillStyle=p>.75?"#edc34f":"#b82e38";ctx.fillRect(x+2,y+2,(w-4)*G.clamp(p,0,1),6)}
  function drawEnemy(e){
    if(!e.alive||e.x+e.w<G.camera-120||e.x>G.camera+W/(G.level.zoom||1)+120)return;const frame=Math.floor(e.anim)%6;
    if(e.type==="tower"){towerSprite(e,frame);health(e);return}
    if(e.type==="chickenJockey"){chickenJockeySprite(e,frame);health(e);if(e.state==="windup")charge(G.cx(e)-34,e.y-93,68,1-e.timer/.25);return}
    if(e.type==="miniElephant"){const rows={patrol:0,hurt:0,windup:1,charge:1,sweep:2,stomp:3,recover:0,leap:1,drop:3},row=rows[e.state]??0;miniElephantSprite(e,row,e.state==="windup"?0:frame,e.state==="hurt"?.5:1);health(e);if(e.state==="windup")charge(G.cx(e)-48,e.y-34,96,1-e.timer/.65);else if(e.state==="stomp"&&!e.stomped)charge(G.cx(e)-55,e.y-38,110,G.clamp((1.45-e.timer)/.99,0,1));return}
    if(e.type==="mounted"){const mountedFrame=e.state==="windup"?0:frame;mountedSprite(e,mountedFrame);health(e);if(e.state==="windup")charge(G.cx(e)-45,e.y-70,90,1-e.timer/.9);return}
    let img=art.sword,rows=2,row=0,dw=108,dh=154;
    if(e.type==="javelin"){img=art.javelin;dw=118;dh=169;row=e.state==="throw"?1:0}
    else if(e.type==="gladiator"){img=art.gladiator;rows=3;dw=122;dh=174;row=["attack","windup"].includes(e.state)?1:e.state==="block"?2:0}
    else row=["windup","attack","recover"].includes(e.state)?1:0;
    const key=e.type==="javelin"?"javelin":e.type==="gladiator"?"gladiator":"sword",bottom=spriteBottoms[key][row][frame],renderW=enemySheetWidth(key,img,6,dw);anchoredSheet(img,6,rows,row,frame,G.cx(e)-renderW/2,e.y+e.h,renderW,dh,e.dir<0,1,0,bottom);if(e.maxHp>1)health(e);
  }

  function player(){
    const p=G.player,animFactor=G.creative.active&&G.level.devOnly&&G.creative.extendedAnimation?5:1;if(p.invuln>0&&Math.floor(G.elapsed*18)%2)return;
    if(p.petting>0){
      const heroArt=heroArtFor(p),phase=1-p.petting/1.2,frame=phase<.24?1:phase<.78?2:1,size=156;
      heroEquipmentSprite(heroArt,0,frame,G.cx(p),p.y+p.h,size,136,p.facing<0,1,0,spriteBottoms.hero[0][frame]);
      const handX=G.cx(G.pet)-p.facing*22,handY=G.pet.y+10,startX=G.cx(p)+p.facing*10,startY=p.y+p.h-67-Math.sin(phase*Math.PI)*5;
      rough(startX,startY,handX,handY,"#263b76",6,phase*9);rough(startX,startY,handX,handY,"#d5a878",3.2,phase*9+2);
      ctx.fillStyle="#d5a878";ctx.strokeStyle="#263b76";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(handX,handY,5,0,Math.PI*2);ctx.fill();ctx.stroke();return;
    }
    if(p.climbing||p.getup>0){const row=p.climbing?0:1,frame=p.climbing?Math.floor(p.climbAnim)%6:G.clamp(Math.floor((.66*animFactor-p.getup)/(.66*animFactor)*6),0,5),dw=104,dh=190,bottom=spriteBottoms.climb[row][frame],climbArt=p.silverArmor&&art.climbSilver.complete&&art.climbSilver.naturalWidth?art.climbSilver:art.climb;anchoredSheet(climbArt,6,2,row,frame,G.cx(p)-dw/2,p.y+p.h,dw,dh,p.facing<0,1,0,bottom);return}
    if(p.vaultDown>0&&p.attack<=0&&p.slingAnim<=0&&!p.shielding){
      const phase=G.clamp(1-p.vaultDown/.34,0,1),frame=Math.min(5,Math.floor(phase*6)),size=164,motionArt=heroMotionArtFor(p);
      if(motionArt){heroMotionSprite(motionArt,1,frame,G.cx(p),p.y+p.h,size,size,heroMotionFlipFor(p),246);return}
    }
    if(!p.grounded&&p.attack<=0&&p.slingAnim<=0&&!p.shielding){
      const frame=p.vy<-740?0:p.vy<-500?1:p.vy<-150?2:p.vy<180?3:p.vy<600?4:5,size=164,motionArt=heroMotionArtFor(p);
      if(motionArt){heroMotionSprite(motionArt,0,frame,G.cx(p),p.y+p.h,size,size,heroMotionFlipFor(p),246);return}
    }
    let row=0,frame=Math.floor(p.walk)%6;
    if(p.attack>0){row=1;frame=G.clamp(Math.floor((.46*animFactor-p.attack)/(.46*animFactor)*6),0,5)}
    else if(p.shielding||p.shieldCooldown>4.65){row=2;frame=p.shieldCooldown>4.65?5:p.shieldRaise>.14*animFactor?1:p.shieldRaise>0?2:3}
    else if(p.slingAnim>0){row=3;frame=G.clamp(Math.floor((.43*animFactor-p.slingAnim)/(.43*animFactor)*6),0,5)}
    const size=156,trim=row===1||row===2?20:0,bottom=spriteBottoms.hero[row][frame],heroArt=heroArtFor(p);if(!heroEquipmentSprite(heroArt,row,frame,G.cx(p),p.y+p.h,size,size,p.facing<0,1,trim,bottom)){ctx.fillStyle="#a62430";ctx.fillRect(p.x,p.y,p.w,p.h)}
  }
  function flowerPet(){
    const p=G.pet,img=p.kind==="chicken"?art.chicken:art.pet;if(!p.owned||p.respawnTimer>0||!img.complete||!img.naturalWidth)return;
    const beingPetted=p.petted>0;let row,frame,bottom,dw,dh;
    if(p.kind==="chicken"){
      const bottoms=[[334,331,330,328],[289,362,231,294],[263,261,257,263]];
      row=p.attacking>0?2:!p.grounded?1:0;frame=row===2?G.clamp(Math.floor((.72-p.attacking)/.72*4),0,3):Math.floor(p.anim)%4;bottom=bottoms[row][frame];dw=100;dh=100;
    }else{
      const bottoms=[[455,459,464,472],[371,333,248,385]];row=p.attacking>0?1:0;frame=row?G.clamp(Math.floor((.55-p.attacking)/.55*4),0,3):Math.floor(p.anim)%4;bottom=bottoms[row][frame];dw=112;dh=104;
    }
    ctx.save();if(beingPetted){ctx.translate(G.cx(p),p.y+p.h);ctx.rotate(Math.sin(G.elapsed*18)*.055);ctx.translate(-G.cx(p),-(p.y+p.h))}
    anchoredSheet(img,4,p.kind==="chicken"?3:2,row,frame,G.cx(p)-dw/2,p.y+p.h,dw,dh,p.facing>0,p.fade*(p.flash>0?.55:1),0,bottom);ctx.restore();
    if(beingPetted){for(let i=0;i<3;i++){const age=(1.2-p.petted+i*.22)%1.2,x=G.cx(p)+(i-1)*15+Math.sin(age*8+i)*4,y=p.y-8-age*22;ctx.save();ctx.globalAlpha=G.clamp(1-age/.95,0,1);ctx.fillStyle=i===1?"#d84d68":"#e88991";ctx.beginPath();ctx.moveTo(x,y+5);ctx.bezierCurveTo(x-9,y-2,x-10,y+9,x,y+16);ctx.bezierCurveTo(x+10,y+9,x+9,y-2,x,y+5);ctx.fill();ctx.restore()}}
  }
  function elephant(){
    const b=G.boss;if(!b)return;
    if(!b.alive){if(b.deathFade>0)elephantSprite(b,3,5,b.deathFade);return}
    const rows={idle:0,windup:1,charge:1,sweep:2,stomp:3},row=rows[b.state]??0,frame=b.state==="windup"?0:Math.floor(b.anim)%6;
    elephantSprite(b,row,frame,b.flash>0?.48:1);
    if(b.state==="windup")charge(G.cx(b)-80,b.y-31,160,1-b.timer/.65);
  }

function groundWaves(){
    for(const w of G.shockwaves){const fade=G.clamp(w.life/.22,0,1),blast=w.blast||1;ctx.save();ctx.globalAlpha=fade;ctx.translate(w.x+w.w/2,w.y+w.h);ctx.scale(w.dir*blast,blast);
      for(let i=0;i<(w.blast?4:3);i++){const back=-i*18,crest=(w.blast?32:25)-i*4;ctx.strokeStyle=i===0?"#5d4031":"#9a7049";ctx.lineWidth=(w.blast?5.5:4)-i*.7;ctx.beginPath();ctx.moveTo(back-32,0);ctx.quadraticCurveTo(back,-crest,back+32,0);ctx.stroke()}
      if(w.blast){ctx.strokeStyle="#6d4432";ctx.lineWidth=3;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-42+i*20,2);ctx.lineTo(-52+i*23,12+Math.sin(i)*5);ctx.stroke()}}
      ctx.fillStyle="#755038";for(let i=0;i<(w.blast?8:4);i++){ctx.beginPath();ctx.arc(-35+i*11,-4-Math.sin(w.age*15+i)*9,2.5+i%3,0,Math.PI*2);ctx.fill()}ctx.restore()}
  }

function projectiles(){
    for(const b of G.bolts){
      const x=b.x+b.w/2,y=b.y+b.h/2;ctx.save();ctx.translate(x,y);ctx.rotate(b.angle);
      rough(-27,0,15,0,"#263b76",6,b.x);rough(-27,0,16,0,"#8b552f",3.2,b.x+2);
      ctx.strokeStyle="#d2ae6a";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-22,-3);ctx.lineTo(-18,3);ctx.moveTo(-18,-3);ctx.lineTo(-14,3);ctx.stroke();
      ctx.fillStyle="#d9dde0";ctx.strokeStyle="#263b76";ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(14,0);ctx.quadraticCurveTo(20,-6,27,0);ctx.quadraticCurveTo(20,6,14,0);ctx.closePath();ctx.fill();ctx.stroke();
      rough(16,0,25,0,"#71809a",1.2,b.x+5);ctx.restore();
    }
    for(const s of G.shots){if(art.stone.complete&&art.stone.naturalWidth){ctx.save();ctx.translate(s.x+7,s.y+7);ctx.rotate(G.elapsed*9);ctx.drawImage(art.stone,-11,-8,22,16);ctx.restore()}else{ctx.fillStyle="#6c655f";ctx.beginPath();ctx.arc(s.x+7,s.y+7,7,0,Math.PI*2);ctx.fill();rough(s.x+2,s.y+4,s.x+12,s.y+11,"#263b76",1.3,s.x)}}
    for(const egg of G.eggShots){ctx.save();ctx.translate(egg.x+9,egg.y+11);ctx.rotate(egg.angle);ctx.fillStyle="#eee7c9";ctx.strokeStyle="#263b76";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,7,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();rough(-3,-4,2,4,"#c3b99a",1,egg.x);ctx.restore()}
  }
  function sparks(){for(const p of G.particles){ctx.globalAlpha=G.clamp(p.life*2,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
  function finish(){
    if(G.level.boss||G.level.devOnly)return;const zone=G.level.finish,x=zone?zone.x+zone.w/2:G.level.width-120,ground=zone?zone.y+zone.h:(G.platforms.find(p=>p.ground&&x>=p.x&&x<=p.x+p.w)?.y??590),top=zone?zone.y:ground-205,remaining=G.level.requiresElephants?G.enemies.filter(e=>e.type==="miniElephant"&&e.alive).length:0,locked=remaining>0;ctx.fillStyle="#d9c89e";ctx.fillRect(x-48,top,24,ground-top);ctx.fillRect(x+48,top,24,ground-top);ctx.fillRect(x-55,top-15,134,28);rough(x-55,top-13,x+79,top-13,"#263b76",2.5,2);
    if(locked){ctx.fillStyle="#713038";for(let y=top+20;y<ground-12;y+=27){ctx.fillRect(x-27,y,78,11);rough(x-28,y+2,x+52,y+2,"#263b76",2,y)}ctx.fillStyle="#fff1ce";ctx.font="800 12px 'DM Sans',sans-serif";ctx.textAlign="center";ctx.fillText(`${remaining} ELEPHANT${remaining===1?"":"S"} REMAIN`,x+12,top-27);ctx.textAlign="left"}
    ctx.fillStyle=locked?"#6b3a3f":"#8b2632";ctx.beginPath();ctx.moveTo(x+72,top+20);ctx.lineTo(x+145,top+40);ctx.lineTo(x+72,top+69);ctx.closePath();ctx.fill();rough(x+72,top+19,x+72,ground-55,"#263b76",3,7);
  }
  function heart(x,y,full){
    ctx.save();ctx.translate(x,y);ctx.fillStyle=full?"#b62b37":"#c8bba7";ctx.strokeStyle="#263b76";ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,9);ctx.bezierCurveTo(-16,-2,-17,18,0,27);ctx.bezierCurveTo(17,18,16,-2,0,9);ctx.fill();ctx.stroke();ctx.restore();
  }
  function armorPip(x,y,full){
    ctx.save();ctx.translate(x,y);ctx.fillStyle=full?"#dce4eb":"#918f91";ctx.strokeStyle="#263b76";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(8,-3);ctx.lineTo(6,6);ctx.quadraticCurveTo(0,13,-6,6);ctx.lineTo(-8,-3);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function hud(){
    const p=G.player;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle="#fff8e9dd";ctx.beginPath();ctx.roundRect(24,22,520,72,18);ctx.fill();ctx.strokeStyle="#263b76";ctx.lineWidth=2.5;ctx.stroke();
    if(p.silverArmor)for(let i=0;i<2;i++)armorPip(43+i*22,35,i<p.armorPoints);for(let i=0;i<5;i++)heart(52+i*38,49,i<p.hp);ctx.fillStyle="#4d3540";ctx.font="700 14px 'DM Sans',sans-serif";ctx.fillText("HP",34,84);const infiniteMoney=G.creative.active&&G.creative.infiniteMoney,infiniteStones=G.creative.active&&G.creative.infiniteStones;ctx.fillText(infiniteMoney?"DENARII ∞":`DENARII ${p.coins}`,250,53);ctx.fillText(p.hasSling?(infiniteStones?"STONES ∞":`STONES ${p.ammo}/${p.maxAmmo}`):"SLING: NOT FOUND",325,53);
    const ready=p.shieldCooldown<=0,regen=ready&&p.shieldHits>0?1-G.clamp(p.shieldRegen/4,0,1):0,pct=ready?(4-p.shieldHits+regen)/4:1-p.shieldCooldown/5;ctx.fillStyle="#d9caa9";ctx.fillRect(249,68,274,11);ctx.fillStyle=ready?"#3e7180":"#a83a3c";ctx.fillRect(251,70,270*G.clamp(pct,0,1),7);ctx.fillStyle="#4d3540";ctx.font="700 10px 'DM Sans',sans-serif";const shieldText=!ready?`SHIELD RECOVERY ${p.shieldCooldown.toFixed(1)}s`:p.shieldHits>0?`SHIELD ${4-p.shieldHits} BLOCKS | +1 IN ${p.shieldRegen.toFixed(1)}s`:`SHIELD 4 BLOCKS`;ctx.fillText(shieldText,325,89);
    ctx.textAlign="right";ctx.font="800 13px 'DM Sans',sans-serif";ctx.fillText(`${G.level.subtitle.toUpperCase()} · ${G.level.name.toUpperCase()}`,W-28,42);ctx.textAlign="left";
    ctx.textAlign="right";ctx.fillStyle="#4d3540";ctx.font="700 11px 'DM Sans',sans-serif";ctx.fillText(localClock.cycling?localClock.label+" IN-GAME - "+(localClock.day?"DAY":"NIGHT"):"12:00 - FIXED DAY",W-28,61);ctx.textAlign="left";
    if(G.boss?.alive){const b=G.boss,bw=650,bx=(W-bw)/2,by=112;ctx.fillStyle="#241c25dd";ctx.fillRect(bx,by,bw,24);ctx.fillStyle="#9f2730";ctx.fillRect(bx+4,by+4,(bw-8)*b.hp/b.maxHp,16);ctx.strokeStyle="#f0cd72";ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,24);ctx.fillStyle="#fff4dd";ctx.textAlign="center";ctx.font="800 12px 'DM Sans'";ctx.fillText("CARTHAGINIAN WAR ELEPHANT",W/2,by-7);ctx.textAlign="left"}
    if(G.banner){ctx.globalAlpha=Math.min(1,G.clamp(G.banner.time,0,1)*1.4);ctx.textAlign="center";ctx.fillStyle="#fff8e9e8";ctx.beginPath();ctx.roundRect(W/2-245,168,490,82,16);ctx.fill();ctx.strokeStyle="#263b76";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#7e202b";ctx.font="800 25px 'Fredoka',sans-serif";ctx.fillText(G.banner.text,W/2,204);ctx.fillStyle="#604d46";ctx.font="700 12px 'DM Sans'";ctx.fillText(G.banner.sub,W/2,228);ctx.textAlign="left";ctx.globalAlpha=1}
    ctx.restore();
  }
  function draw(){
    localClock=readLocalClock();sky();const jx=G.shakeTime>0?(Math.random()-.5)*G.shakePower:0,jy=G.shakeTime>0?(Math.random()-.5)*G.shakePower:0;
    const zoom=G.level.zoom||1;ctx.save();ctx.scale(zoom,zoom);ctx.translate(-G.camera+jx,-G.cameraY+jy);backdrop();bushes();G.platforms.forEach(platform);ladders();statues();merchantShop();finish();collectibles();tutorialTips();groundWaves();G.enemies.forEach(drawEnemy);elephant();flowerPet();projectiles();player();sparks();ctx.restore();if(!localClock.day||localClock.daylight<.5){ctx.fillStyle="rgba(7,14,39,"+(!localClock.day?.19:.07)+")";ctx.fillRect(0,0,W,H)}hud();
  }
  let last=performance.now();
  function frame(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;G.update(dt);draw();requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
})();
