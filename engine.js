(() => {
  "use strict";
  const L = window.CAMPAIGN_LEVELS, audio = window.RomanAudio;
  const key = Object.create(null), G = window.RS = {};
  const MAX_AMMO=30,PET_DAMAGE=.6,WAR_ELEPHANT_HP=26.8;
  const creative = { active:false, invincible:true, flying:true, infiniteMoney:true, infiniteStones:true, extendedAnimation:false, dayNightCycle:false, menuOpen:true };
  const shop = { open:false, near:false, message:"" };
  const inventory = { open:false, message:"" };
  const items = { selected:"sling" };
  const pet = {owned:false,salamanderOwned:false,chickenOwned:false,kind:"salamander",mode:"passive",salamanderMode:"passive",chickenMode:"passive",x:0,y:0,w:70,h:38,vx:0,vy:0,grounded:false,onPlatform:null,facing:-1,anim:0,attacking:0,attackCooldown:0,eggLaunched:true,eggTargetX:0,eggTargetY:0,flash:0,petted:0,fade:1,invuln:0,knockedByEnemy:false,respawnTimer:0,dropTimer:0,dropPlatform:null};
  const P = {
    x:120,y:400,w:48,h:96,vx:0,vy:0,facing:1,grounded:false,onPlatform:null,dropTimer:0,dropPlatform:null,vaultDown:0,ledge:null,ledgeTimer:0,grabBuffer:0,
    hp:5,maxHp:5,invuln:0,lock:0,attack:0,attackId:0,slingAnim:0,petting:0,hasDiamondSword:false,hasMasterDiamondSword:false,weapon:"gladius",
    shielding:false,shieldHits:0,shieldCooldown:0,shieldRegen:0,shieldRaise:0,coyote:0,jumpDebounce:0,jumpBuffer:0,hasSling:false,ammo:0,maxAmmo:MAX_AMMO,coins:0,bananas:0,bananaCooldown:0,hasSilverArmor:false,silverArmor:false,armorPoints:0,walk:0,climbing:false,ladder:null,climbAnim:0,getup:0,getupStartX:0,getupStartY:0,getupTargetX:0,getupTargetY:0,getupPlatform:null,ladderExitLock:0,
    checkpoint:{x:120,y:400}
  };
  let li=0, level=L[0], platforms=[],enemies=[],coins=[],stones=[],bananas=[],sling=null;
  let bolts=[],shots=[],eggShots=[],particles=[],shockwaves=[],boss=null,bossPhase=0,running=false,paused=false,next=null;
  let elapsed=0,shakeTime=0,shakePower=0,tremor=0,banner=null,camera=0,cameraY=0;
  const creativeLevelSelect=document.getElementById("creative-level");
  const levelNumerals=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
  function syncCreativeLevelOptions(){
    const selected=creativeLevelSelect.value;creativeLevelSelect.replaceChildren(...L.map((entry,index)=>{
      const option=document.createElement("option");option.value=String(index);option.textContent=entry.devOnly?`DEV - ${entry.name}`:`${levelNumerals[index]||index+1} - ${entry.name}`;return option;
    }));creativeLevelSelect.value=L[selected]?selected:"0";
  }
  syncCreativeLevelOptions();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const HP_STD_RATIO=.0667;
  function gaussianHp(mean){let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();const z=clamp(Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v),-3,3),value=mean*(1+z*HP_STD_RATIO);return Math.max(.05,Math.round(value*1000)/1000)}
  const attackDamage=()=>creative.active?3:1;
  const meleeDamage=()=>attackDamage()*(P.weapon==="master"&&P.hasMasterDiamondSword?3:P.weapon==="diamond"&&P.hasDiamondSword?2:1);
  const extendedAnimation=()=>creative.active&&level.devOnly&&creative.extendedAnimation,animFactor=()=>extendedAnimation()?5:1;
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const cx=o=>o.x+o.w/2, away=(from,x)=>x<from?-1:1;
  const enemy=d=>{if(d.type==="foot"&&Math.random()<1/12){const bottom=d.y+d.h;d={...d,type:"chickenJockey",y:bottom-72,w:68,h:72,hp:2,maxHp:2,groundY:bottom,vy:0}}const hp=gaussianHp(d.hp);return{...d,hp,maxHp:hp,baseHp:d.hp,alive:true,dir:d.dir||-1,state:"patrol",timer:0,cooldown:Math.random()*.5,anim:Math.random()*2,knock:0,hit:false,petHit:false,lastAttack:-1,shieldHits:d.shieldHits||0,shieldCooldown:d.shieldCooldown||0}};

  Object.defineProperties(G,{
    player:{get:()=>P},level:{get:()=>level},levelIndex:{get:()=>li},platforms:{get:()=>platforms},ladders:{get:()=>level.ladders||[]},
    enemies:{get:()=>enemies},coins:{get:()=>coins},stones:{get:()=>stones},bananas:{get:()=>bananas},sling:{get:()=>sling},
    bolts:{get:()=>bolts},shots:{get:()=>shots},eggShots:{get:()=>eggShots},particles:{get:()=>particles},shockwaves:{get:()=>shockwaves},boss:{get:()=>boss},
    bossPhase:{get:()=>bossPhase},running:{get:()=>running},paused:{get:()=>paused},elapsed:{get:()=>elapsed},
    banner:{get:()=>banner},camera:{get:()=>camera},cameraY:{get:()=>cameraY},shakeTime:{get:()=>shakeTime},shakePower:{get:()=>shakePower},creative:{get:()=>creative},shop:{get:()=>shop},inventory:{get:()=>inventory},items:{get:()=>items},pet:{get:()=>pet}
  });
  Object.assign(G,{clamp,overlap,cx});

  function loadLevel(index,fresh=false){
    const candidate=L[index];
    if(!Number.isInteger(index)||index<0||!candidate||!candidate.start||!Array.isArray(candidate.platforms)){
      console.error("Cannot load level index",index,"from",L.length,"available levels");
      creativeLevelSelect.value=String(li);banner={text:"LEVEL UNAVAILABLE",sub:"Reload the game to refresh level data",time:2.6};return false;
    }
    setPaused(false);
    setShop(false);setInventory(false);
    li=index;level=candidate;
    platforms=level.platforms.map(p=>({...p,prevX:p.x,prevY:p.y}));
    enemies=(level.enemies||[]).map(enemy);
    coins=(level.coins||[]).map(([x,y])=>({x,y,w:24,h:24,taken:false,bob:Math.random()*6}));
    stones=(level.stones||[]).map(([x,y])=>({x,y,w:25,h:20,taken:false,respawn:0,bob:Math.random()*5}));
    bananas=(level.bananas||[]).map(([x,y])=>({x,y,w:46,h:54,taken:false,bob:Math.random()*6,renewable:!!level.bananaRespawn,respawn:0,respawnDelay:level.bananaRespawn||0}));
    sling=level.sling?{...level.sling,w:42,h:46,taken:false}:null;
    bolts=[];shots=[];eggShots=[];particles=[];shockwaves=[];boss=level.boss?newBoss():null;bossPhase=level.boss?1:0;
    tremor=level.shakeEvery||0;shakeTime=0;camera=0;cameraY=level.height?Math.max(0,level.height-720/(level.zoom||1)):720-720/(level.zoom||1);banner={text:level.name,sub:level.subtitle,time:2.6};
    if(fresh){P.coins=0;P.hasSling=false;P.ammo=0;P.hasSilverArmor=false;P.silverArmor=false;P.armorPoints=0;P.bananas=0;P.bananaCooldown=0;P.hasDiamondSword=false;P.hasMasterDiamondSword=false;P.weapon="gladius";pet.owned=false;pet.salamanderOwned=false;pet.chickenOwned=false;pet.kind="salamander";pet.mode="passive";pet.salamanderMode="passive";pet.chickenMode="passive";items.selected="sling"}pet.petted=0;
    if(index>=2)P.hasSling=true;if(creative.active){P.hasSling=true;if(creative.infiniteStones)P.ammo=MAX_AMMO}
    Object.assign(P,{x:level.start.x,y:level.start.y,vx:0,vy:0,hp:5,invuln:0,lock:0,attack:0,slingAnim:0,petting:0,shielding:false,shieldHits:0,shieldCooldown:0,shieldRegen:0,shieldRaise:0,coyote:0,jumpDebounce:0,jumpBuffer:0,grounded:false,onPlatform:null,dropTimer:0,dropPlatform:null,vaultDown:0,ledge:null,ledgeTimer:0,grabBuffer:0,climbing:false,ladder:null,climbAnim:0,getup:0,getupPlatform:null,ladderExitLock:0});
    if(P.silverArmor)P.armorPoints=2;if(pet.owned)placePetNearPlayer();P.checkpoint={...level.start};
    document.getElementById("level-subtitle").textContent=`${level.subtitle} � ${level.name}`;
    document.getElementById("game-status").lastChild.textContent=` Legionary � ${level.name}`;
    document.getElementById("message-screen").classList.remove("visible");creativeLevelSelect.value=String(index);updateItemBar();updateDevControls();next=null;return true;
  }
  function newBoss(){const hp=gaussianHp(WAR_ELEPHANT_HP);return{x:1710,y:342,w:330,h:248,hp,maxHp:hp,baseHp:WAR_ELEPHANT_HP,alive:true,deathFade:1,facing:-1,state:"idle",timer:1.25,index:0,anim:0,throwCD:1.2,flash:0,stomped:false,hit:false,petHit:false,lastAttack:-1}}
  function start(){audio.ensure();loadLevel(0,true);running=true;document.getElementById("start-screen").classList.remove("visible")}
  function complete(){
    if(!running)return;running=false;next=li+1;
    document.getElementById("message-eyebrow").textContent=`PROVINCE ${li+1} COMPLETE`;
    const titles=["The road opens!","The beast awaits.","The beast has fallen!","The final siege begins!","The heights await!"];
    const texts=["Via Aurelia is secure. Continue toward Zama.","You found the sling. Now face the Beast of Zama.","The elephant is defeated. Fight onward through the Carthage Citadel.","Carthage Citadel is breached. Storm the final walls.","The walls are breached. Climb the high aqueduct and claim the heights."];
    document.getElementById("message-title").textContent=titles[li]||"Province secured!";
    document.getElementById("message-text").textContent=texts[li]||"The legion advances.";
    document.getElementById("restart-button").innerHTML="Continue campaign <span>?</span>";
    document.getElementById("message-screen").classList.add("visible");
  }
  function victory(){
    running=false;next=0;
    document.getElementById("message-eyebrow").textContent="CAMPAIGN COMPLETE";
    document.getElementById("message-title").textContent="Roma Victor!";
    document.getElementById("message-text").textContent=`The heights of Carthage are secured. Rome is victorious. You recovered ${P.coins} denarii.`;
    document.getElementById("restart-button").innerHTML="March again <span>?</span>";
    document.getElementById("message-screen").classList.add("visible");
  }
  const creativePanel=document.getElementById("creative-panel"),creativeToggle=document.getElementById("creative-toggle"),creativeCollapse=document.getElementById("creative-collapse"),creativeExtendedWrap=document.getElementById("creative-extended-wrap"),creativeExtendedToggle=document.getElementById("creative-extended-animation");
  const shopPanel=document.getElementById("shop-panel"),shopDenarii=document.getElementById("shop-denarii"),shopAmmo=document.getElementById("shop-ammo"),shopBuyStone=document.getElementById("shop-buy-stone"),shopArmorStatus=document.getElementById("shop-armor-status"),shopBuyArmor=document.getElementById("shop-buy-armor"),shopDiamondStatus=document.getElementById("shop-diamond-status"),shopBuyDiamond=document.getElementById("shop-buy-diamond"),shopMasterDiamondStatus=document.getElementById("shop-master-diamond-status"),shopBuyMasterDiamond=document.getElementById("shop-buy-master-diamond"),shopPetStatus=document.getElementById("shop-pet-status"),shopBuyPet=document.getElementById("shop-buy-pet"),shopChickenStatus=document.getElementById("shop-chicken-status"),shopBuyChicken=document.getElementById("shop-buy-chicken"),shopBananaStatus=document.getElementById("shop-banana-status"),shopBuyBanana=document.getElementById("shop-buy-banana"),shopFeedback=document.getElementById("shop-feedback");
  const itemBar=document.getElementById("item-bar"),itemButtons=[...document.querySelectorAll(".item-slot")],itemSlingStatus=document.getElementById("item-sling-status"),itemPetMode=document.getElementById("item-pet-mode"),itemChickenMode=document.getElementById("item-chicken-mode"),itemBananaStatus=document.getElementById("item-banana-status");
  const inventoryPanel=document.getElementById("inventory-panel"),inventoryButtons=[...document.querySelectorAll(".equipment-card")],inventoryFeedback=document.getElementById("inventory-feedback"),equipGladiusStatus=document.getElementById("equip-gladius-status"),equipDiamondStatus=document.getElementById("equip-diamond-status"),equipMasterDiamondStatus=document.getElementById("equip-master-diamond-status"),equipBronzeStatus=document.getElementById("equip-bronze-status"),equipSilverStatus=document.getElementById("equip-silver-status");
  const pauseScreen=document.getElementById("pause-screen"),pauseToggle=document.getElementById("pause-toggle"),resumeButton=document.getElementById("resume-button");
  function setPaused(on){
    paused=!!on&&running&&!shop.open&&!inventory.open;
    for(const k in key)key[k]=false;P.shielding=false;
    pauseScreen.classList.toggle("visible",paused);pauseScreen.setAttribute("aria-hidden",String(!paused));
    pauseToggle.classList.toggle("active",paused);pauseToggle.textContent=paused?"Resume":"Pause";pauseToggle.setAttribute("aria-label",paused?"Resume game":"Pause game");
    if(paused)document.getElementById("game-status").lastChild.textContent=" Campaign paused";
    else if(running)document.getElementById("game-status").lastChild.textContent=" Legionary - "+level.name;
  }
  function shopIsNear(){
    const s=level.shop;if(!s)return false;
    return Math.abs(cx(P)-(s.x+s.w/2))<360&&Math.abs((P.y+P.h)-(s.y+s.h))<150;
  }
  function itemAvailable(id){return id==="sling"?P.hasSling:id==="pet"?pet.salamanderOwned:id==="chicken"?pet.chickenOwned:id==="banana"?P.bananas>0:false}
  function activatePet(kind){
    if((kind==="salamander"&&!pet.salamanderOwned)||(kind==="chicken"&&!pet.chickenOwned))return false;
    const changed=pet.kind!==kind;if(changed)pet[pet.kind+"Mode"]=pet.mode;pet.kind=kind;pet.mode=pet[kind+"Mode"];pet.owned=true;pet.w=kind==="chicken"?58:70;pet.h=kind==="chicken"?48:38;
    if(changed)placePetNearPlayer(true);return true;
  }
  function updateItemBar(){
    for(const button of itemButtons){const id=button.dataset.item,available=itemAvailable(id);button.disabled=!available;button.classList.toggle("selected",items.selected===id)}
    itemSlingStatus.textContent=P.hasSling?`${P.ammo}/${MAX_AMMO} stones`:"Not found";
    itemPetMode.textContent=pet.salamanderOwned?`${pet.kind==="salamander"?"Active · ":""}${pet.salamanderMode==="attack"?"Attack":"Passive"}`:"Locked";
    itemChickenMode.textContent=pet.chickenOwned?`${pet.kind==="chicken"?"Active · ":""}${pet.chickenMode==="attack"?"Attack":"Passive"}`:"Locked";
    itemBananaStatus.textContent=P.bananaCooldown>0?`Cooldown ${P.bananaCooldown.toFixed(1)}s`:`${P.bananas} banana${P.bananas===1?"":"s"}`;

  }
  function selectItem(id){
    if(!itemAvailable(id))return;if(id==="pet")activatePet("salamander");if(id==="chicken")activatePet("chicken");items.selected=id;updateItemBar();
  }
  function eatBanana(){
    if(P.bananas<1)return;
    if(P.bananaCooldown>0){banner={text:"BANANA COOLDOWN",sub:`Ready in ${P.bananaCooldown.toFixed(1)}s`,time:1.2};return}
    if(P.hp>=P.maxHp){banner={text:"FULL HEALTH",sub:"Save the banana for later.",time:1.2};return}
    const restored=Math.min(2,P.maxHp-P.hp);P.hp+=restored;P.bananas--;P.bananaCooldown=5;
    banner={text:`+${restored} HP`,sub:"Banana eaten - 5s cooldown",time:1.5};burst(cx(P),P.y+28,"#f1c83f",14);audio.play("pickup");
    if(P.bananas<1)items.selected=pet.chickenOwned?"chicken":pet.salamanderOwned?"pet":P.hasSling?"sling":"banana";updateItemBar();
  }
  function useSelectedItem(){
    if(items.selected==="banana"){eatBanana();return}

    if((items.selected==="pet"||items.selected==="chicken")&&activatePet(items.selected==="chicken"?"chicken":"salamander")){
      pet.mode=pet.mode==="passive"?"attack":"passive";pet[pet.kind+"Mode"]=pet.mode;const name=pet.kind==="chicken"?"CHICKEN":"SALAMANDER";
      banner={text:`${name}: ${pet.mode.toUpperCase()}`,sub:pet.mode==="attack"?(pet.kind==="chicken"?"It keeps its distance and hurls eggs at enemies.":"It hunts enemies while staying near you."):"It follows you without seeking fights.",time:1.8};
      updateItemBar();return;
    }
    throwStone();
  }
  function updateShopUI(){
    const infiniteMoney=creative.active&&creative.infiniteMoney,infiniteStones=creative.active&&creative.infiniteStones;
    shopDenarii.textContent=infiniteMoney?"Infinite denarii":`${P.coins} denarii`;
    shopAmmo.textContent=infiniteStones?`Infinite / ${MAX_AMMO} stones`:`${P.ammo} / ${MAX_AMMO} stones`;
    shopBuyStone.disabled=infiniteStones||P.ammo>=MAX_AMMO||(!infiniteMoney&&P.coins<2);
    shopArmorStatus.textContent=P.hasSilverArmor?(P.silverArmor?"Owned - equipped":"Owned - in inventory"):"2 armor points";
    shopBuyArmor.textContent=P.hasSilverArmor?"Owned":"Buy - 30 denarii";
    shopBuyArmor.disabled=P.hasSilverArmor||(!infiniteMoney&&P.coins<30);
    shopDiamondStatus.textContent=P.hasDiamondSword?(P.weapon==="diamond"?"Owned - equipped":"Owned - in inventory"):"2x melee damage · longer reach · stronger knockback";
    shopBuyDiamond.textContent=P.hasDiamondSword?"Owned":"Buy - 68 denarii";
    shopBuyDiamond.disabled=P.hasDiamondSword||(!infiniteMoney&&P.coins<68);
    shopMasterDiamondStatus.textContent=P.hasMasterDiamondSword?(P.weapon==="master"?"Owned - equipped":"Owned - in inventory"):"3x melee damage · 50% above diamond";
    shopBuyMasterDiamond.textContent=P.hasMasterDiamondSword?"Owned":"Buy - 100 denarii";
    shopBuyMasterDiamond.disabled=P.hasMasterDiamondSword||(!infiniteMoney&&P.coins<100);
    shopPetStatus.textContent=pet.salamanderOwned?"Owned - ground fighter":"Small ground companion";
    shopBuyPet.textContent=pet.salamanderOwned?"Owned":"Buy - 10 denarii";
    shopBuyPet.disabled=pet.salamanderOwned||(!infiniteMoney&&P.coins<10);
    shopChickenStatus.textContent=pet.chickenOwned?"Owned - ranged egg fighter":"Ranged ground companion";
    shopBuyChicken.textContent=pet.chickenOwned?"Owned":"Buy - 15 denarii";
    shopBuyChicken.disabled=pet.chickenOwned||(!infiniteMoney&&P.coins<15);
    shopBananaStatus.textContent=`${P.bananas} carried`;shopBuyBanana.disabled=!infiniteMoney&&P.coins<10;
    shopFeedback.textContent=shop.message||"Press Q to leave the counter.";
  }
  function setShop(open){
    if(open&&(!running||!shopIsNear()||inventory.open))return;
    shop.open=open;shop.near=shopIsNear();
    shopPanel.classList[open?"add":"remove"]("visible");shopPanel.setAttribute("aria-hidden",String(!open));
    if(open){P.vx=0;P.shielding=false;key.q=false;shop.message="";updateShopUI()}
  }
  function updateInventoryUI(){
    for(const button of inventoryButtons){
      const type=button.dataset.equipType,id=button.dataset.equip;
      const owned=id==="gladius"||id==="bronze"||(id==="diamond"&&P.hasDiamondSword)||(id==="master"&&P.hasMasterDiamondSword)||(id==="silver"&&P.hasSilverArmor);
      const equipped=id==="gladius"?P.weapon==="gladius":id==="diamond"?P.weapon==="diamond":id==="master"?P.weapon==="master":id==="bronze"?!P.silverArmor:P.silverArmor;
      button.disabled=!owned;button.classList.toggle("equipped",equipped);
    }
    equipGladiusStatus.textContent=P.weapon==="gladius"?"Equipped":"Owned";
    equipDiamondStatus.textContent=!P.hasDiamondSword?"Locked":P.weapon==="diamond"?"Equipped":"Owned";
    equipMasterDiamondStatus.textContent=!P.hasMasterDiamondSword?"Locked":P.weapon==="master"?"Equipped":"Owned";
    equipBronzeStatus.textContent=!P.silverArmor?"Equipped":"Owned";
    equipSilverStatus.textContent=!P.hasSilverArmor?"Locked":P.silverArmor?"Equipped":"Owned";
    inventoryFeedback.textContent=inventory.message||"Press I to close.";
  }
  function setInventory(open){
    if(open&&(!running||shop.open))return;
    inventory.open=open;inventoryPanel.classList[open?"add":"remove"]("visible");inventoryPanel.setAttribute("aria-hidden",String(!open));
    if(open){P.vx=0;P.shielding=false;inventory.message="";updateInventoryUI()}
  }
  function equipItem(type,id){
    if(type==="weapon"){
      if(id==="diamond"&&!P.hasDiamondSword||id==="master"&&!P.hasMasterDiamondSword)return;
      P.weapon=id;inventory.message=id==="master"?"Master diamond sword equipped.":id==="diamond"?"Diamond sword equipped.":"Gladius equipped.";
    }else if(type==="armor"){
      if(id==="silver"&&!P.hasSilverArmor)return;
      P.silverArmor=id==="silver";P.armorPoints=P.silverArmor?2:0;
      inventory.message=P.silverArmor?"Silver armor equipped.":"Original armor equipped.";
    }
    updateInventoryUI();updateShopUI();
  }  function buyStone(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(creative.active&&creative.infiniteStones)shop.message="Infinite stones are already enabled.";
    else if(P.ammo>=MAX_AMMO)shop.message="Your stone satchel is already full.";
    else if(!infiniteMoney&&P.coins<2)shop.message="You need 2 denarii for a stone.";
    else{if(!infiniteMoney)P.coins-=2;P.ammo++;shop.message="One sling stone added.";audio.play("pickup")}
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function buyArmor(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(P.hasSilverArmor)shop.message="You already own the silver armor.";
    else if(!infiniteMoney&&P.coins<30)shop.message="You need 30 denarii for silver armor.";
    else{if(!infiniteMoney)P.coins-=30;P.hasSilverArmor=true;P.silverArmor=true;P.armorPoints=2;shop.message="Silver armor equipped: every second hit costs HP.";audio.play("pickup")}
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function buyDiamond(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(P.hasDiamondSword)shop.message="The diamond sword is already yours.";
    else if(!infiniteMoney&&P.coins<68)shop.message="You need 68 denarii for the diamond sword.";
    else{if(!infiniteMoney)P.coins-=68;P.hasDiamondSword=true;P.weapon="diamond";shop.message="Diamond sword equipped: double damage, longer reach, stronger knockback.";audio.play("pickup")}
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function buyMasterDiamond(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(P.hasMasterDiamondSword)shop.message="The master diamond sword is already yours.";
    else if(!infiniteMoney&&P.coins<100)shop.message="You need 100 denarii for the master diamond sword.";
    else{if(!infiniteMoney)P.coins-=100;P.hasMasterDiamondSword=true;P.weapon="master";shop.message="Master diamond sword equipped: 50% more damage than diamond.";audio.play("pickup")}
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function buyPet(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(pet.salamanderOwned)shop.message="The flower salamander already travels with you.";
    else if(!infiniteMoney&&P.coins<10)shop.message="You need 10 denarii for the flower salamander.";
    else{
      if(!infiniteMoney)P.coins-=10;pet.salamanderOwned=true;pet.owned=true;pet.kind="salamander";pet.w=70;pet.h=38;pet.mode="passive";pet.salamanderMode="passive";placePetNearPlayer();items.selected="pet";
      shop.message="The flower salamander joined you in passive mode.";audio.play("pickup");updateItemBar();
    }
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function buyChicken(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(pet.chickenOwned)shop.message="The egg chicken already travels with you.";
    else if(!infiniteMoney&&P.coins<15)shop.message="You need 15 denarii for the egg chicken.";
    else{if(!infiniteMoney)P.coins-=15;pet.chickenOwned=true;pet.owned=true;pet.kind="chicken";pet.w=58;pet.h=48;pet.mode="passive";pet.chickenMode="passive";placePetNearPlayer();items.selected="chicken";shop.message="The egg chicken joined you in passive mode.";audio.play("pickup")}
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function buyBanana(){
    if(!shop.open)return;const infiniteMoney=creative.active&&creative.infiniteMoney;
    if(!infiniteMoney&&P.coins<10)shop.message="You need 10 denarii for a banana.";
    else{if(!infiniteMoney)P.coins-=10;P.bananas++;items.selected="banana";shop.message="One banana added to your pack.";audio.play("pickup")}
    updateShopUI();updateItemBar();updateInventoryUI();
  }
  function setExtendedAnimation(on){
    const enabled=!!on&&creative.active&&level.devOnly;if(enabled===creative.extendedAnimation){creativeExtendedToggle.checked=enabled;return}
    const ratio=enabled?5:.2;P.attack*=ratio;P.slingAnim*=ratio;P.shieldRaise*=ratio;P.getup*=ratio;creative.extendedAnimation=enabled;creativeExtendedToggle.checked=enabled;
    if(enabled)banner={text:"EXTENDED ANIMATION",sub:"Player frames now play at 20% speed",time:2};
  }
  function updateDevControls(){
    const available=creative.active&&level.devOnly;creativeExtendedWrap.hidden=!available;if(!available)setExtendedAnimation(false);
  }
  function setCreativeMenu(open){
    creative.menuOpen=open;creativePanel.classList[open?"remove":"add"]("collapsed");
    creativeCollapse.textContent=open?"-":"+";creativeCollapse.setAttribute("aria-expanded",String(open));
    creativeCollapse.setAttribute("aria-label",open?"Collapse creative menu":"Expand creative menu");
    creativeToggle.setAttribute("aria-expanded",String(open));
  }
  function setCreative(on){if(!on&&creative.extendedAnimation)setExtendedAnimation(false);
    creative.active=on;creativePanel.classList[on?"add":"remove"]("visible");creativePanel.setAttribute("aria-hidden",String(!on));
    creativeToggle.classList[on?"add":"remove"]("active");creativeToggle.textContent=on?"Creative: ON":"Creative";
    if(on){setCreativeMenu(true);running=true;document.getElementById("start-screen").classList.remove("visible");P.hasSling=true;if(creative.infiniteStones)P.ammo=MAX_AMMO;banner={text:"CREATIVE MODE",sub:"Invincibility, flight, 3x damage and level inspector enabled",time:2.3}}
    else{creativePanel.classList.remove("collapsed");creative.menuOpen=true}
    updateItemBar();updateDevControls();
  }
  function toggleCreativePanel(){if(!creative.active)setCreative(true);else setCreativeMenu(!creative.menuOpen)}
  document.getElementById("shop-close").addEventListener("click",()=>setShop(false));
  document.getElementById("inventory-close").addEventListener("click",()=>setInventory(false));
  for(const button of inventoryButtons)button.addEventListener("click",()=>equipItem(button.dataset.equipType,button.dataset.equip));
  shopBuyStone.addEventListener("click",()=>{audio.ensure();buyStone()});
  shopBuyArmor.addEventListener("click",()=>{audio.ensure();buyArmor()});
  shopBuyDiamond.addEventListener("click",()=>{audio.ensure();buyDiamond()});
  shopBuyMasterDiamond.addEventListener("click",()=>{audio.ensure();buyMasterDiamond()});
  shopBuyPet.addEventListener("click",()=>{audio.ensure();buyPet()});
  shopBuyChicken.addEventListener("click",()=>{audio.ensure();buyChicken()});
  shopBuyBanana.addEventListener("click",()=>{audio.ensure();buyBanana()});
  for(const button of itemButtons)button.addEventListener("click",()=>selectItem(button.dataset.item));
  itemBar.addEventListener("wheel",e=>{
    const available=["sling","pet","chicken","banana"].filter(itemAvailable);if(available.length<2)return;
    e.preventDefault();const current=Math.max(0,available.indexOf(items.selected)),dir=e.deltaY>0?1:-1;selectItem(available[(current+dir+available.length)%available.length]);
  },{passive:false});
  creativeToggle.addEventListener("click",toggleCreativePanel);
  creativeCollapse.addEventListener("click",()=>setCreativeMenu(!creative.menuOpen));
  document.getElementById("creative-exit").addEventListener("click",()=>setCreative(false));
  creativeLevelSelect.addEventListener("change",e=>{if(!loadLevel(Number(e.target.value)))return;running=true;P.hasSling=true;if(creative.infiniteStones)P.ammo=MAX_AMMO});
  document.getElementById("creative-invincible").addEventListener("change",e=>creative.invincible=e.target.checked);
  document.getElementById("creative-flying").addEventListener("change",e=>creative.flying=e.target.checked);
  creativeExtendedToggle.addEventListener("change",e=>setExtendedAnimation(e.target.checked));
  document.getElementById("creative-infinite-money").addEventListener("change",e=>{creative.infiniteMoney=e.target.checked;if(shop.open)updateShopUI()});
  document.getElementById("creative-infinite-stones").addEventListener("change",e=>{creative.infiniteStones=e.target.checked;if(e.target.checked)P.ammo=MAX_AMMO;updateItemBar();if(shop.open)updateShopUI()});
  document.getElementById("creative-day-night").addEventListener("change",e=>creative.dayNightCycle=e.target.checked);
  pauseToggle.addEventListener("click",()=>setPaused(!paused));
  resumeButton.addEventListener("click",()=>setPaused(false));
  document.getElementById("start-button").addEventListener("click",start);
  document.getElementById("restart-button").addEventListener("click",()=>{audio.ensure();const fresh=next===0;loadLevel(next??li,fresh);running=true});
  addEventListener("keydown",e=>{
    const k=e.key.toLowerCase();
    if(paused){if((k==="p"||k==="escape")&&!e.repeat)setPaused(false);e.preventDefault();return}
    key[k]=true;
    if(shop.open){key[k]=false;if((k==="q"||k==="escape")&&!e.repeat)setShop(false);e.preventDefault();return}
    if(inventory.open){key[k]=false;if((k==="i"||k==="escape")&&!e.repeat)setInventory(false);e.preventDefault();return}
    if((k==="p"||k==="escape")&&!e.repeat){key[k]=false;e.preventDefault();setPaused(true);return}
    if(k==="i"&&!e.repeat){key[k]=false;e.preventDefault();setInventory(true);return}
    if(k==="q"&&!e.repeat&&shopIsNear()){key[k]=false;e.preventDefault();setShop(true);return}
    if([" ","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault();
    if((k==="w"||k==="arrowup")&&!e.repeat){P.jumpBuffer=.16;if(!P.grounded&&!P.climbing&&P.getup<=0)P.grabBuffer=.18}
    if(k==="arrowdown"&&!e.repeat)key.drop=true;
    if(k===" "&&!e.repeat)startAttack();
    if((k==="1"||k==="2"||k==="3"||k==="4")&&!e.repeat)selectItem(k==="1"?"sling":k==="2"?"pet":k==="3"?"chicken":"banana");
    if(k==="e"&&!e.repeat)useSelectedItem();
    if(k==="z"&&!e.repeat)startPetting();
    if(k==="c"&&!e.repeat)toggleCreativePanel();
    if(k==="s"&&!e.repeat&&P.shieldCooldown===0)P.shieldRaise=.28*animFactor();
    if(k==="m"&&!e.repeat){const m=audio.toggle();document.getElementById("game-status").lastChild.textContent=m?" Music muted":` Legionary � ${level.name}`}
    if(k==="r"&&!e.repeat){audio.ensure();loadLevel(li);running=true;document.getElementById("start-screen").classList.remove("visible")}
  });
  addEventListener("keyup",e=>key[e.key.toLowerCase()]=false);
  function startPetting(){
    if(!running||!pet.owned||shop.open||inventory.open||!P.grounded||P.attack>0||P.slingAnim>0||P.shielding||P.climbing||P.getup>0||P.petting>0)return;
    const ground=P.onPlatform||groundPlatformAt(cx(P));if(!ground)return;
    let side=P.facing||1;
    if(level.shop&&Math.abs(cx(P)-(level.shop.x+level.shop.w/2))<level.shop.w/2+160)side=cx(P)<level.shop.x+level.shop.w/2?-1:1;
    const roomAhead=side>0?ground.x+ground.w-(P.x+P.w):P.x-ground.x;
    if(roomAhead<pet.w+28)side*=-1;
    const desired=side>0?P.x+P.w+18:P.x-pet.w-18;
    pet.x=clamp(desired,ground.x+5,ground.x+ground.w-pet.w-5);pet.y=ground.y-pet.h;
    pet.onPlatform=ground;pet.grounded=true;pet.vx=0;pet.vy=0;pet.attacking=0;pet.petted=1.2;
    P.facing=side;P.vx=0;P.vy=0;P.attack=0;P.slingAnim=0;P.petting=1.2;
    pet.facing=-side;audio.play("pickup");burst(cx(pet),pet.y+5,"#e9a5a8",5);
  }
  function startAttack(){if(!running||P.attack>0||P.slingAnim>0||P.petting>0||P.shielding||P.climbing||P.getup>0)return;P.attack=.46*animFactor();P.attackId++;audio.play("attack")}
  function throwStone(){
    const infinite=creative.active&&creative.infiniteStones;
    if(!running||!P.hasSling||(!infinite&&P.ammo<1)||P.slingAnim>0||P.attack>0||P.petting>0||P.shielding||P.climbing||P.getup>0)return;
    if(!infinite)P.ammo--;P.slingAnim=.43*animFactor();shots.push({x:cx(P)+P.facing*28,y:P.y+34,w:15,h:15,vx:P.facing*760,vy:-150,life:2});audio.play("sling");updateItemBar();
  }
  function burst(x,y,color,n){for(let i=0;i<n;i++)particles.push({x,y,color,life:.35+Math.random()*.45,vx:(Math.random()-.5)*260,vy:-80-Math.random()*260,size:2+Math.random()*5})}
  function shake(t,p){shakeTime=Math.max(shakeTime,t);shakePower=Math.max(shakePower,p)}

  function groundPlatformAt(x,referenceY=P.y+P.h){
    let best=null,bestDistance=Infinity;for(const p of platforms)if(x>=p.x&&x<=p.x+p.w){const distance=Math.abs(p.y-referenceY);if(distance<bestDistance){best=p;bestDistance=distance}}return best;
  }
  function nearestGroundPlatform(x){
    let best=null,bestDistance=Infinity;
    for(const p of platforms){const px=clamp(x,p.x,p.x+p.w),distance=Math.abs(px-x)+Math.abs(p.y-(P.y+P.h))*.35;if(distance<bestDistance){best=p;bestDistance=distance}}
    return best;
  }
  function magicPetBurst(){burst(cx(pet),pet.y+pet.h*.45,"#a87be0",13);burst(cx(pet),pet.y+pet.h*.5,"#69dec5",10)}
  function placePetNearPlayer(magic=true){
    if(!pet.owned)return;
    const desired=cx(P)-P.facing*86,ground=groundPlatformAt(desired)||nearestGroundPlatform(desired);
    if(ground){pet.x=clamp(desired-pet.w/2,ground.x+5,ground.x+ground.w-pet.w-5);pet.y=ground.y-pet.h;pet.onPlatform=ground;pet.grounded=true}
    else{pet.x=P.x-P.facing*80;pet.y=P.y+P.h-pet.h;pet.onPlatform=null;pet.grounded=false}
    pet.vx=0;pet.vy=0;pet.facing=P.facing;pet.anim=0;pet.attacking=0;pet.invuln=.45;pet.knockedByEnemy=false;pet.respawnTimer=0;pet.dropTimer=0;pet.dropPlatform=null;pet.fade=magic?0:1;
    if(magic)magicPetBurst();
  }
  function petCanBeHit(){return pet.owned&&pet.respawnTimer<=0&&pet.invuln<=0}
  function hurtPet(from,o={}){
    if(!petCanBeHit())return false;pet.petted=0;pet.attacking=0;pet.grounded=false;pet.onPlatform=null;pet.dropTimer=0;pet.dropPlatform=null;
    pet.vx=away(from,cx(pet))*(o.knockback||360)*2;pet.vy=(o.lift??-280)*1.55;pet.invuln=.7;pet.knockedByEnemy=true;pet.flash=.25;
    burst(cx(pet),pet.y+pet.h*.45,"#e8a94e",9);audio.play("hit");return true;
  }
  function dismissPet(){pet.respawnTimer=5;pet.fade=0;pet.vx=0;pet.vy=0;pet.grounded=false;pet.onPlatform=null;pet.knockedByEnemy=false;pet.attacking=0}
  function movePetY(n){
    const bottom=pet.y+pet.h;pet.y+=n;pet.grounded=false;pet.onPlatform=null;
    if(n<0)return;
    for(const p of platforms)if(p!==pet.dropPlatform&&overlap(pet,p)&&bottom<=p.y+10){
      pet.y=p.y-pet.h;pet.vy=0;pet.grounded=true;pet.onPlatform=p;break;
    }
  }
  function petCombatTarget(){
    const aggressive=pet.mode==="attack";let target=null,best=aggressive?620:390;
    for(const e of enemies)if(e.alive){const vertical=(e.y+e.h)-(pet.y+pet.h),playerThreat=Math.abs(cx(e)-cx(P))<245&&Math.abs((e.y+e.h)-(P.y+P.h))<155,eligible=aggressive?(vertical>-160&&vertical<440):playerThreat&&Math.abs(vertical)<145;if(!eligible)continue;const distance=Math.hypot(cx(e)-cx(pet),vertical*.65);if(distance<best){best=distance;target=e}}
    if(boss?.alive){const vertical=(boss.y+boss.h)-(pet.y+pet.h),eligible=aggressive?(vertical>-180&&vertical<460):Math.abs(cx(boss)-cx(P))<300;if(eligible){const distance=Math.hypot(cx(boss)-cx(pet),vertical*.55);if(distance<best+60)target=boss}}
    return target;
  }
  function spawnPetEgg(tx,ty){
    const x=cx(pet)+pet.facing*10,y=pet.y+2,dx=tx-x,t=clamp(Math.abs(dx)/450,.38,.92);
    eggShots.push({x:x-9,y:y-11,w:18,h:22,vx:dx/t,vy:(ty-y-.5*560*t*t)/t,life:2.4,angle:0});
    burst(x,y,"#eee7c9",6);
  }
  function updatePet(dt){
    if(!pet.owned)return;
    if(pet.respawnTimer>0){pet.respawnTimer=Math.max(0,pet.respawnTimer-dt);if(pet.respawnTimer===0)placePetNearPlayer(true);return}
    pet.fade=Math.min(1,pet.fade+dt*2.35);pet.invuln=Math.max(0,pet.invuln-dt);pet.attackCooldown=Math.max(0,pet.attackCooldown-dt);pet.attacking=Math.max(0,pet.attacking-dt);pet.flash=Math.max(0,pet.flash-dt);pet.petted=Math.max(0,pet.petted-dt);pet.dropTimer=Math.max(0,pet.dropTimer-dt);if(pet.dropTimer===0)pet.dropPlatform=null;if(pet.kind==="chicken"&&pet.attacking>0&&!pet.eggLaunched&&pet.attacking<.48){spawnPetEgg(pet.eggTargetX,pet.eggTargetY);pet.eggLaunched=true}
    if(pet.petted>0){pet.vx=0;pet.attacking=0;pet.anim+=dt*10;return}
    const viewH=720/(level.zoom||1),outOfFrame=pet.x+pet.w<camera-90||pet.x>camera+1370||pet.y+pet.h<cameraY-90||pet.y>cameraY+viewH+90;if(pet.knockedByEnemy&&outOfFrame){dismissPet();return}
    if(pet.knockedByEnemy){pet.x+=pet.vx*dt;pet.vx*=Math.pow(.42,dt);pet.vy=Math.min(980,pet.vy+1700*dt);movePetY(pet.vy*dt);pet.anim+=dt*7;const launchedOut=pet.x+pet.w<camera-90||pet.x>camera+1370||pet.y+pet.h<cameraY-90||pet.y>cameraY+viewH+90;if(launchedOut){dismissPet();return}if(pet.grounded&&pet.invuln===0)pet.knockedByEnemy=false;return}
    const distanceToPlayer=Math.hypot(cx(P)-cx(pet),(P.y+P.h)-(pet.y+pet.h));
    if(distanceToPlayer>590||Math.abs((P.y+P.h)-(pet.y+pet.h))>285||pet.y>(level.height||720)+100){placePetNearPlayer(true);return}
    const target=petCombatTarget(),targetBottom=target?target.y+target.h:P.y+P.h,targetBelow=!!target&&targetBottom>pet.y+pet.h+75,followPlayerDrop=!target&&P.dropTimer>0&&P.dropPlatform&&pet.grounded&&pet.onPlatform===P.dropPlatform,targetDir=target?(Math.sign(cx(target)-cx(pet))||pet.facing):pet.facing,followX=target?(pet.kind==="chicken"?cx(target)-targetDir*235:cx(target)):cx(P)-P.facing*82,dx=followX-cx(pet);
    let moveDir=Math.abs(dx)>(target?43:34)?Math.sign(dx):0;
    if(targetBelow&&!moveDir&&pet.onPlatform){const left=pet.x-pet.onPlatform.x,right=pet.onPlatform.x+pet.onPlatform.w-(pet.x+pet.w);moveDir=left<right?-1:1}
    const speed=target?235:185;pet.vx+=(moveDir*speed-pet.vx)*clamp(dt*10,0,1);if(!moveDir&&Math.abs(pet.vx)<4)pet.vx=0;if(moveDir)pet.facing=moveDir;
    const playerAbove=!target&&P.y+P.h<pet.y+pet.h-42&&Math.abs(cx(P)-cx(pet))<340;
    if(followPlayerDrop){pet.dropTimer=.32;pet.dropPlatform=pet.onPlatform;pet.vy=155;pet.grounded=false;pet.onPlatform=null}
    else if(pet.grounded&&playerAbove){pet.vy=-720;pet.vx=(Math.sign(cx(P)-cx(pet))||P.facing)*255;pet.grounded=false;pet.onPlatform=null}
    else if(pet.grounded&&targetBelow&&Math.abs(dx)<155){pet.dropTimer=.3;pet.dropPlatform=pet.onPlatform;pet.vy=155;pet.grounded=false;pet.onPlatform=null}
    else if(pet.grounded&&moveDir){
      const aheadX=cx(pet)+moveDir*(pet.w/2+30),ahead=groundPlatformAt(aheadX,pet.y+pet.h);
      if(targetBelow&&(!ahead||ahead.y>pet.y+pet.h+30)){pet.dropTimer=.3;pet.dropPlatform=pet.onPlatform;pet.vy=155;pet.grounded=false;pet.onPlatform=null}else if(!ahead||Math.abs(ahead.y-(pet.y+pet.h))>30){pet.vy=-720;pet.vx=moveDir*285;pet.grounded=false;pet.onPlatform=null}
      else if(ahead.y<pet.y+pet.h-42){pet.vy=-720;pet.vx=moveDir*260;pet.grounded=false;pet.onPlatform=null}
    }
    pet.x+=pet.vx*dt;pet.vy=Math.min(950,pet.vy+1700*dt);movePetY(pet.vy*dt);pet.x=clamp(pet.x,-120,level.width-pet.w+120);
    if(pet.grounded&&pet.invuln===0)pet.knockedByEnemy=false;if(pet.grounded&&Math.abs(pet.vx)>12)pet.anim+=dt*9;else if(!pet.grounded)pet.anim+=dt*6;
    if(target&&pet.kind==="chicken"&&Math.abs(cx(target)-cx(pet))<500&&Math.abs((target.y+target.h)-(pet.y+pet.h))<220&&pet.attackCooldown<=0){
      pet.facing=Math.sign(cx(target)-cx(pet))||pet.facing;pet.attackCooldown=1.45;pet.attacking=.72;pet.eggLaunched=false;pet.eggTargetX=cx(target);pet.eggTargetY=target.y+target.h*.42;pet.flash=.16;pet.vx=0;
    }else if(target&&pet.kind!=="chicken"&&Math.abs(cx(target)-cx(pet))<60&&Math.abs((target.y+target.h)-(pet.y+pet.h))<120&&pet.attackCooldown<=0){
      pet.attackCooldown=1.05;pet.attacking=.55;pet.flash=.18;pet.vx=-pet.facing*75;if(target===boss)damageBoss(PET_DAMAGE,cx(pet));else damageEnemy(target,PET_DAMAGE,cx(pet),115);burst(cx(pet)+pet.facing*28,pet.y+18,"#e7a53f",7);
    }
  }

  function movePlatforms(dt){
    for(const p of platforms){
      p.prevX=p.x;p.prevY=p.y;
      if(!p.moving){p.dx=p.dy=0;continue}
      const s=Math.sin(elapsed*p.speed+p.phase);
      p.x=p.baseX+(p.axis==="x"?s*p.range:0);p.y=p.baseY+(p.axis==="y"?s*p.range:0);
      p.dx=p.x-p.prevX;p.dy=p.y-p.prevY;
    }
    if(P.grounded&&P.onPlatform?.moving){P.x+=P.onPlatform.dx;P.y+=P.onPlatform.dy}
  }
  function rememberLedge(p,side){
    const reach=p.y-P.y;
    if(P.grounded||P.climbing||P.getup>0||p===P.dropPlatform||reach<8||reach>56)return;
    P.ledge={platform:p,side};P.ledgeTimer=.2;
  }
  function beginLedgeGetup(){
    const ledge=P.ledge;if(!ledge||P.ledgeTimer<=0||P.grabBuffer<=0)return false;
    const p=ledge.platform,side=ledge.side,startX=side>0?p.x-P.w-2:p.x+p.w+2,startY=p.y-P.h+64;
    P.x=startX;P.y=startY;P.facing=side;P.getup=.66*animFactor();P.getupStartX=startX;P.getupStartY=startY;
    P.getupTargetX=clamp(side>0?p.x+8:p.x+p.w-P.w-8,p.x+6,p.x+p.w-P.w-6);P.getupTargetY=p.y-P.h;P.getupPlatform=p;
    P.vx=0;P.vy=0;P.grounded=false;P.onPlatform=null;P.shielding=false;P.attack=0;P.slingAnim=0;P.ledge=null;P.ledgeTimer=0;P.grabBuffer=0;P.jumpBuffer=0;key.jump=false;return true;
  }
  function moveX(n){
    P.x+=n;
    for(const p of platforms)if(p!==P.dropPlatform&&overlap(P,p)){
      if(n>0){rememberLedge(p,1);P.x=p.x-P.w}else if(n<0){rememberLedge(p,-1);P.x=p.x+p.w}P.vx=0;
    }
  }
  function moveY(n){
    const bottom=P.y+P.h,top=P.y;P.y+=n;P.grounded=false;P.onPlatform=null;
    for(const p of platforms)if(p!==P.dropPlatform&&overlap(P,p)){
      if(n>=0&&bottom<=p.y+Math.max(8,Math.abs(p.dy||0)+3)){P.y=p.y-P.h;P.vy=0;P.grounded=true;P.onPlatform=p}
      else if(n<0&&top>=p.y+p.h-8){P.y=p.y+p.h;P.vy=0}
      else{const l=P.x+P.w-p.x,r=p.x+p.w-P.x;P.x=l<r?p.x-P.w:p.x+p.w;P.vx=0}
    }
  }
  function stompEnemy(previousBottom){
    const feet=P.y+P.h;
    const target=enemies.find(e=>e.alive&&P.x+P.w-8>e.x&&P.x+8<e.x+e.w&&previousBottom<=e.y+14&&feet>=e.y&&feet<=e.y+Math.min(44,e.h*.56));
    if(!target)return false;
    P.y=target.y-P.h-1;P.vy=-590;P.grounded=false;P.onPlatform=null;P.coyote=0;P.lock=.08;
    damageEnemy(target,attackDamage(),cx(target),0);burst(cx(P),P.y+P.h,"#d5b06c",10);shake(.12,4);return true;
  }

  function updatePlayer(dt){
    const wasGettingUp=P.getup>0;P.invuln=Math.max(0,P.invuln-dt);P.lock=Math.max(0,P.lock-dt);P.attack=Math.max(0,P.attack-dt);P.slingAnim=Math.max(0,P.slingAnim-dt);P.petting=Math.max(0,P.petting-dt);P.getup=Math.max(0,P.getup-dt);P.vaultDown=Math.max(0,P.vaultDown-dt);P.ladderExitLock=Math.max(0,P.ladderExitLock-dt);P.jumpDebounce=Math.max(0,P.jumpDebounce-dt);P.jumpBuffer=Math.max(0,P.jumpBuffer-dt);P.ledgeTimer=Math.max(0,P.ledgeTimer-dt);if(P.ledgeTimer===0)P.ledge=null;P.grabBuffer=Math.max(0,P.grabBuffer-dt);P.dropTimer=Math.max(0,P.dropTimer-dt);if(P.dropTimer===0)P.dropPlatform=null;P.shieldRaise=Math.max(0,P.shieldRaise-dt);P.coyote=P.grounded?.13:Math.max(0,P.coyote-dt);
    const bananaTick=Math.ceil(P.bananaCooldown*10);P.bananaCooldown=Math.max(0,P.bananaCooldown-dt);if(Math.ceil(P.bananaCooldown*10)!==bananaTick)updateItemBar();
    const wasShieldRecovering=P.shieldCooldown>0;P.shieldCooldown=Math.max(0,P.shieldCooldown-dt);
    if(wasShieldRecovering&&P.shieldCooldown===0&&P.shieldHits>=4){P.shieldHits=0;P.shieldRegen=0}
    if(P.shieldCooldown===0&&P.shieldHits>0&&!key.s){
      P.shieldRegen=Math.max(0,P.shieldRegen-dt);
      if(P.shieldRegen===0){P.shieldHits--;P.shieldRegen=P.shieldHits>0?4:0;burst(cx(P),P.y+42,"#79b7ac",4)}
    }
    if(P.petting>0){key.drop=false;key.jump=false;P.jumpBuffer=0;P.vx=0;P.vy=0;P.shielding=false;pickups(dt);return}
    P.shielding=!!key.s&&P.shieldCooldown===0&&P.attack===0&&P.slingAnim===0&&!P.climbing&&P.getup===0;
    const input=(key.d||key.arrowright?1:0)-(key.a||key.arrowleft?1:0),up=!!(key.w||key.arrowup),down=!!(key.s||key.arrowdown);
    const nearLadder=(level.ladders||[]).find(l=>cx(P)>=l.x-18&&cx(P)<=l.x+l.w+18&&P.y+P.h>=l.y-6&&P.y<l.y+l.h-8);
    if(!P.grounded&&!P.climbing&&P.getup===0&&P.ledgeTimer>0&&P.grabBuffer>0)beginLedgeGetup();
    const canEnterLadder=nearLadder&&(down||(up&&P.y+P.h>nearLadder.y+18));
    if(!P.climbing&&P.getup===0&&P.ladderExitLock===0&&canEnterLadder){P.climbing=true;P.ladder=nearLadder;P.vaultDown=0;P.vx=0;P.vy=0;P.attack=0;P.slingAnim=0;P.shielding=false}
    if(P.climbing){key.drop=false;key.jump=false;P.jumpBuffer=0;
      const l=P.ladder,vertical=(down?1:0)-(up?1:0);P.shielding=false;P.vx=0;P.vy=vertical*175;
      P.x+=(l.x+l.w/2-P.w/2-P.x)*clamp(dt*14,0,1);P.y+=P.vy*dt;if(vertical)P.climbAnim+=dt*8/animFactor();
      if(input&&!up&&!down){P.climbing=false;P.ladder=null;P.vx=input*190;P.vy=-80}
      else if(vertical<0&&P.y+P.h<=l.y+72){const ledge=platforms.find(p=>l.x+l.w>p.x&&l.x<p.x+p.w&&Math.abs(p.y-l.y)<3);if(ledge){const leftX=l.x-P.w-12,rightX=l.x+l.w+12,leftFits=leftX>=ledge.x+6,rightFits=rightX+P.w<=ledge.x+ledge.w-6,side=rightFits&&(!leftFits||P.facing>=0)?1:-1;P.climbing=false;P.ladder=null;P.getup=.66*animFactor();P.getupStartX=P.x;P.getupStartY=P.y;P.getupTargetX=clamp(side>0?rightX:leftX,ledge.x+6,ledge.x+ledge.w-P.w-6);P.getupTargetY=ledge.y-P.h;P.getupPlatform=ledge;P.vx=0;P.vy=0;P.grounded=false;P.onPlatform=null}}
      else if(vertical>0&&P.y>=l.y+l.h-P.h){P.climbing=false;P.ladder=null;P.y=l.y+l.h-P.h;P.vy=0}
      if(P.climbing){key.drop=false;key.jump=false;P.jumpBuffer=0;pickups(dt);return}
    }
    if(P.getup>0&&!wasGettingUp){key.drop=false;key.jump=false;P.jumpBuffer=0;pickups(dt);return}
    if(wasGettingUp){key.drop=false;key.jump=false;P.jumpBuffer=0;const getupTotal=.66*animFactor(),t=clamp(1-P.getup/getupTotal,0,1),ease=t*t*(3-2*t);P.shielding=false;P.vx=0;P.vy=0;P.x=P.getupStartX+(P.getupTargetX-P.getupStartX)*ease;P.y=P.getupStartY+(P.getupTargetY-P.getupStartY)*ease;if(P.getup===0){P.x=P.getupTargetX;P.y=P.getupTargetY;P.grounded=true;P.onPlatform=P.getupPlatform;P.getupPlatform=null;P.ladderExitLock=.32;P.jumpDebounce=.1;P.coyote=.13}pickups(dt);return}
    if(creative.active&&creative.flying){key.jump=false;key.drop=false;P.jumpBuffer=0;const vertical=(key.q||key.arrowdown?1:0)-(key.w||key.arrowup?1:0),flySpeed=key.shift?1248:420;P.vx=input*flySpeed;P.vy=vertical*flySpeed;P.x=clamp(P.x+P.vx*dt,0,level.width-P.w);P.y=clamp(P.y+P.vy*dt,20,(level.height||720)-P.h);P.grounded=false;P.onPlatform=null;if(Math.abs(P.vx)>18)P.walk+=dt*9/animFactor();pickups(dt);swordHit();return}
    if(key.drop){const support=P.onPlatform;if(P.grounded&&support&&!support.ground){P.dropTimer=.42;P.dropPlatform=support;P.vaultDown=.34;P.grounded=false;P.onPlatform=null;P.y+=9;P.vx+=P.facing*110;P.vy=135;P.coyote=0}key.drop=false}
    if(P.lock<=0){const target=input*(P.shielding?105:320);P.vx+=(target-P.vx)*clamp(dt*11,0,1);if(input)P.facing=input;if(!input&&Math.abs(P.vx)<5)P.vx=0}
    if(P.shielding){const grip=P.grounded?(input?.32:.012):.16;P.vx*=Math.pow(grip,dt);if(P.grounded&&!input&&Math.abs(P.vx)<8)P.vx=0}
    if(P.jumpBuffer>0&&P.jumpDebounce===0&&P.coyote>0&&!P.shielding){P.jumpBuffer=0;P.vaultDown=0;P.vy=-840;P.grounded=false;P.onPlatform=null;P.coyote=0;P.grabBuffer=0;P.ledge=null;P.ledgeTimer=0}
    if(Math.abs(P.vx)>18&&P.grounded)P.walk+=dt*9/animFactor();
    P.vy=Math.min(950,P.vy+1700*dt);const previousBottom=P.y+P.h,wasFalling=P.vy>80;moveX(P.vx*dt);moveY(P.vy*dt);if(P.grounded)P.vaultDown=0;if(wasFalling)stompEnemy(previousBottom);P.x=clamp(P.x,0,level.width-P.w);
    if(P.y>(level.height||720)+180)die();pickups(dt);swordHit();if(!level.boss&&!level.devOnly&&!creative.active){const summit=level.finish&&overlap(P,level.finish),gate=!level.finish&&P.x+P.w>level.width-115;if(summit||gate){const remaining=level.requiresElephants?enemies.filter(e=>e.type==="miniElephant"&&e.alive).length:0;if(remaining){if(gate){P.x=level.width-164-P.w;P.vx=Math.min(0,P.vx)}banner={text:"GATE SEALED",sub:`Defeat ${remaining} mini-elephant${remaining===1?"":"s"} to pass`,time:1.25}}else if(level.campaignEnd)victory();else complete()}}
  }
  function pickups(dt){
    for(const c of coins){c.bob+=dt*4;if(c.drop){c.vy+=900*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=Math.pow(.3,dt);if(c.y>=550){c.y=550;c.vx=0;c.vy=0;c.drop=false}}if(!c.taken&&overlap(P,c)){c.taken=true;P.coins++;burst(c.x+12,c.y+12,"#d9a928",8);audio.play("pickup")}}
    for(const b of bananas){
      b.bob+=dt*3.2;if(b.drop){b.vy+=900*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.3,dt);if(b.y>=550){b.y=550;b.vx=0;b.vy=0;b.drop=false}}
      if(b.taken){if(b.renewable&&(b.respawn-=dt)<=0){b.taken=false;b.respawn=0}continue}
      if(!b.taken&&overlap(P,b)){
        const first=P.bananas===0;b.taken=true;if(b.renewable)b.respawn=b.respawnDelay;P.bananas++;if(first)items.selected="banana";
        banner={text:"BANANA FOUND",sub:"Stored in item slot 4",time:1.5};burst(b.x+b.w/2,b.y+b.h/2,"#f1c83f",14);audio.play("pickup");updateItemBar();
      }
    }
    for(const s of stones){
      s.bob+=dt*3;if(s.taken){if(level.boss&&(s.respawn-=dt)<=0)s.taken=false;continue}
      if(P.ammo<MAX_AMMO&&overlap(P,s)){s.taken=true;s.respawn=3;P.ammo++;burst(s.x+10,s.y+8,"#87735f",5);audio.play("pickup");updateItemBar()}
    }
    if(sling&&!sling.taken&&overlap(P,sling)){sling.taken=true;P.hasSling=true;P.ammo=Math.max(P.ammo,3);items.selected="sling";updateItemBar();banner={text:"SLINGSHOT ACQUIRED",sub:"Press E � Carry up to 30 stones",time:3.5};burst(sling.x+20,sling.y+20,"#dfb34d",20);audio.play("pickup")}
  }
  function swordHit(){
    const attackTotal=.46*animFactor();if(P.attack<=attackTotal*(.11/.46)||P.attack>=attackTotal*(.31/.46))return;
    const diamond=P.hasDiamondSword&&P.weapon==="diamond",master=P.hasMasterDiamondSword&&P.weapon==="master",longSword=diamond||master,reach=longSword?116:72,force=longSword?390:210;
    const h={x:P.facing>0?P.x+P.w-3:P.x-(reach-3),y:P.y+(longSword?8:15),w:reach,h:longSword?66:54};
    for(const e of enemies)if(e.alive&&e.lastAttack!==P.attackId&&overlap(h,e)){e.lastAttack=P.attackId;damageEnemy(e,meleeDamage(),cx(P),force)}
    if(boss?.alive&&boss.lastAttack!==P.attackId&&overlap(h,boss)){boss.lastAttack=P.attackId;damageBoss(meleeDamage(),cx(P))}
  }
  function frontBlock(x){return P.shielding&&(x-cx(P))*P.facing>-5}
  function hurt(x,o={}){
    if(P.invuln>0||!running)return false;P.petting=0;pet.petted=0;const dir=away(x,cx(P));
    if(frontBlock(x)){
      P.shieldHits++;P.shieldRegen=4;P.vx=dir*(o.knockback||360)*.5;P.vy=(o.lift??-330)*.5;P.lock=o.horse?.45:.26;P.invuln=.28;
      audio.play("block");burst(cx(P)+P.facing*24,P.y+42,"#f3cf70",8);
      if(P.shieldHits>=4){P.shieldCooldown=5;P.shielding=false;P.lock=Math.max(P.lock,.55);banner={text:"SHIELD BROKEN",sub:"Recovering for 5 seconds",time:1.6};audio.play("break")}
      return true;
    }
    if(creative.active&&creative.invincible){burst(cx(P),P.y+36,"#64c7a2",5);return false}
    const damage=o.damage??1;if(P.silverArmor&&damage>0){P.armorPoints=Math.max(0,P.armorPoints-1);if(P.armorPoints>0){P.vx=dir*(o.knockback||360);P.vy=o.lift??-330;P.lock=o.horse?.45:.26;P.invuln=.62;shake(.16,o.horse?8:4);burst(cx(P),P.y+36,"#cbd5df",12);audio.play("block");return true}P.armorPoints=2}
    P.hp=Math.max(0,P.hp-damage);P.vx=dir*(o.knockback||360);P.vy=o.lift??-330;P.lock=o.horse?.45:.26;P.invuln=.95;
    shake(.22,o.horse?10:5);burst(cx(P),P.y+36,"#a72a30",10);audio.play("hit");if(P.hp<=0)die();return true;
  }
  function die(){
    Object.assign(P,{hp:5,x:P.checkpoint.x,y:P.checkpoint.y,vx:0,vy:0,invuln:1.4,lock:0,shielding:false,attack:0,petting:0,climbing:false,ladder:null,getup:0,getupPlatform:null,ladderExitLock:0,jumpDebounce:0,jumpBuffer:0,dropTimer:0,dropPlatform:null,vaultDown:0,ledge:null,ledgeTimer:0,grabBuffer:0});
    if(P.silverArmor)P.armorPoints=2;
    bolts=[];banner={text:"LEGIONARY FALLEN",sub:"Back into formation",time:1.8};camera=clamp(P.x-448,0,Math.max(0,level.width-1280));cameraY=level.height?Math.max(0,level.height-720/(level.zoom||1)):720-720/(level.zoom||1);shake(.45,12);
  }
  function tossDenarii(e,count){
    for(let i=0;i<count;i++){
      const spread=(i-(count-1)/2)*18;
      coins.push({x:cx(e)-12+spread,y:e.y+e.h*.42,w:24,h:24,taken:false,bob:Math.random()*6,drop:true,vx:spread*4+(Math.random()-.5)*90,vy:-310-Math.random()*120});
    }
  }
  function tossBanana(e){
    bananas.push({x:cx(e)-23,y:e.y+e.h*.38,w:46,h:54,taken:false,bob:Math.random()*6,drop:true,vx:(Math.random()-.5)*150,vy:-330-Math.random()*110});
  }
  function enemyLoot(e){
    if(e.lootDropped)return;e.lootDropped=true;
    const denarii=()=>{const roll=Math.random();return roll<.33?1:roll<.43?2:0};
    if(e.type==="foot"||e.type==="javelin"||e.type==="mounted")tossDenarii(e,denarii());
    else if(e.type==="chickenJockey"){tossDenarii(e,denarii()*2);if(Math.random()<.33)tossBanana(e)}
    else if(e.type==="gladiator"){const roll=Math.random();tossDenarii(e,roll<.33?1:roll<.99?2:0)}
    else if(e.type==="miniElephant"){const roll=Math.random();tossDenarii(e,roll<.33?3:roll<.66?4:roll<.99?5:0);if(Math.random()<.5)tossBanana(e)}
  }  function damageEnemy(e,n,from,force=260){
    const front=(from-cx(e))*e.dir>0;
    if(e.type==="gladiator"&&front&&e.shieldCooldown<=0&&!["attack","recover","hurt"].includes(e.state)){
      e.shieldHits++;burst(cx(e)+e.dir*20,e.y+38,"#efd272",7);
      if(e.shieldHits>=4){e.shieldCooldown=5;e.state="recover";e.timer=.55;e.knock=away(from,cx(e))*160;audio.play("break");burst(cx(e)+e.dir*18,e.y+42,"#9f3035",12)}
      else{e.state="block";e.timer=.35;audio.play("block")}
      return false;
    }
    const airborneMini=e.type==="miniElephant"&&["leap","drop"].includes(e.state)||e.type==="chickenJockey"&&e.state==="jump";
    e.hp-=n;e.knock=away(from,cx(e))*force;e.state=e.hp>0?(airborneMini?e.state:"hurt"):"dead";if(!airborneMini)e.timer=.24;burst(cx(e),e.y+e.h*.45,"#87302f",e.hp>0?7:15);audio.play("hit");if(e.hp<=0){e.alive=false;enemyLoot(e)}return true;
  }

function updateEnemies(dt){
    for(const e of enemies){if(!e.alive)continue;e.anim+=dt*(e.state==="charge"?11:6);e.cooldown=Math.max(0,e.cooldown-dt);e.timer=Math.max(0,e.timer-dt);e.shieldCooldown=Math.max(0,(e.shieldCooldown||0)-dt);if(e.type==="gladiator"&&e.shieldCooldown===0&&e.shieldHits>=4)e.shieldHits=0;e.knock*=Math.pow(.025,dt);
      if(e.type==="tower")towerEnemy(e,dt);else if(e.type==="chickenJockey")chickenJockey(e,dt);else if(e.type==="miniElephant")miniElephant(e,dt);else if(e.type==="mounted")mounted(e,dt);else if(e.type==="javelin")javelin(e,dt);else if(e.type==="gladiator")gladiator(e,dt);else swordsman(e,dt);
      e.x=clamp(e.x,e.min,e.max-e.w)}
    separateEnemies();
  }
  function separateEnemies(){
    const alive=enemies.filter(e=>e.alive);
    for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
      const a=alive[i],b=alive[j];if(a.y+a.h<=b.y+8||b.y+b.h<=a.y+8)continue;
      const ac=cx(a),bc=cx(b),dir=ac<=bc?-1:1,penetration=(a.w+b.w)/2+10-Math.abs(ac-bc);
      if(penetration<=0)continue;const push=Math.min(8,penetration/2);
      a.x=clamp(a.x+dir*push,a.min,a.max-a.w);b.x=clamp(b.x-dir*push,b.min,b.max-b.w);
      a.knock+=dir*18;b.knock-=dir*18;
    }
  }
  function hurtState(e,dt){if(e.state!=="hurt")return false;e.x+=e.knock*dt;if(e.timer<=0)e.state="patrol";return true}
  function enemyAttackTarget(e){
    if(!petCanBeHit()||pet.knockedByEnemy)return P;
    const playerDistance=Math.hypot(cx(P)-cx(e),((P.y+P.h)-(e.y+e.h))*1.15),petDistance=Math.hypot(cx(pet)-cx(e),((pet.y+pet.h)-(e.y+e.h))*1.15);
    return petDistance+42<playerDistance?pet:P;
  }
  function swordsman(e,dt){
    if(hurtState(e,dt))return;const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h);
    if(e.state==="patrol"){if(Math.abs(dx)<155&&Math.abs(dy)<120&&e.cooldown<=0){e.dir=Math.sign(dx)||e.dir;e.state="windup";e.timer=.34;e.hit=false;e.petHit=false}else{e.x+=(e.dir*62+e.knock)*dt;if(e.x<=e.min+2||e.x+e.w>=e.max-2)e.dir*=-1}}
    else if(e.state==="windup"&&e.timer<=0){e.state="attack";e.timer=.34}
    else if(e.state==="attack"){if(e.timer<.24&&e.timer>.08){const h={x:e.dir>0?e.x+e.w-4:e.x-50,y:e.y+14,w:54,h:58};if(!e.hit&&overlap(h,P)){hurt(cx(e),{knockback:390,shieldKnockback:470,lift:-300});e.hit=true}if(!e.petHit&&petCanBeHit()&&overlap(h,pet)){hurtPet(cx(e),{knockback:390,lift:-300});e.petHit=true}}if(e.timer<=0){e.state="recover";e.timer=.48;e.cooldown=.85}}
    else if(["recover","block"].includes(e.state)&&e.timer<=0)e.state="patrol";
  }
  function mounted(e,dt){
    if(hurtState(e,dt))return;const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h),wanted=Math.sign(dx)||e.dir;
    if(e.state==="patrol"){
      if(Math.abs(dx)<780&&Math.abs(dy)<145&&e.cooldown<=0){
        const runway=wanted>0?e.max-e.w-e.x:e.x-e.min;
        if(runway<190){e.dir=-wanted;e.state="reposition";e.timer=.65;return}
        e.dir=wanted;e.state="windup";e.timer=.9;e.hit=false;e.petHit=false;
      }else{e.x+=(e.dir*52+e.knock)*dt;if(e.x<=e.min+2||e.x+e.w>=e.max-2)e.dir*=-1}
    }else if(e.state==="reposition"){
      e.x+=e.dir*72*dt;if(e.timer<=0){e.state="patrol";e.cooldown=.15}
    }else if(e.state==="windup"){
      if(e.timer<=0){e.state="charge";e.timer=1.55;e.hit=false;e.petHit=false}
    }else if(e.state==="charge"){
      e.x+=e.dir*590*dt;
      if(!e.hit&&overlap({x:e.x-8,y:e.y+8,w:e.w+16,h:e.h-8},P)){hurt(cx(e),{horse:true,knockback:610,shieldKnockback:860,lift:-410,shieldLift:-245});e.hit=true}if(!e.petHit&&petCanBeHit()&&overlap({x:e.x-8,y:e.y+8,w:e.w+16,h:e.h-8},pet)){hurtPet(cx(e),{knockback:610,lift:-410});e.petHit=true}
      if(e.timer<=0||e.x<=e.min||e.x+e.w>=e.max){e.state="recover";e.timer=.72;e.cooldown=1.25}
    }else if(e.state==="recover"&&e.timer<=0)e.state="patrol";
  }
  function chickenJockey(e,dt){
    const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h),wanted=Math.sign(dx)||e.dir;
    if(e.state==="hurt"){e.x+=e.knock*dt;if(e.timer<=0)e.state="patrol";return}
    if(e.state==="jump"){
      e.vy=Math.min(430,(e.vy||0)+720*dt);e.y+=e.vy*dt;e.x+=(e.dir*265+e.knock)*dt;const h={x:e.x-4,y:e.y+5,w:e.w+8,h:e.h-5};
      if(!e.hit&&overlap(h,P)){hurt(cx(e),{horse:true,knockback:430,shieldKnockback:570,lift:-330,shieldLift:-210});e.hit=true}if(!e.petHit&&petCanBeHit()&&overlap(h,pet)){hurtPet(cx(e),{knockback:430,lift:-330});e.petHit=true}
      if(e.vy>0&&e.y+e.h>=e.groundY){e.y=e.groundY-e.h;e.vy=0;e.state="recover";e.timer=.38;e.cooldown=.72}return;
    }
    if(e.state==="patrol"){e.dir=wanted;e.y=e.groundY-e.h;if(Math.abs(dx)<390&&Math.abs(dy)<155&&e.cooldown<=0){e.state="windup";e.timer=.25;e.anim=0;e.hit=false;e.petHit=false}else{e.x+=(e.dir*92+e.knock)*dt;if(e.x<=e.min+2||e.x+e.w>=e.max-2)e.dir*=-1}}
    else if(e.state==="windup"&&e.timer<=0){e.state="jump";e.vy=-540}
    else if(e.state==="recover"&&e.timer<=0)e.state="patrol";
  }
  function towerEnemy(e,dt){
    const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h);e.dir=Math.sign(dx)||e.dir;e.knock=0;
    if(e.state==="hurt"){if(e.timer<=0)e.state="patrol";return}
    if(e.state==="patrol"){if(Math.abs(dx)<1050&&Math.abs(dy)<470&&e.cooldown<=0){e.state="throw";e.timer=.8;e.cooldown=1.75;e.thrownA=false;e.thrownB=false;e.aimPet=target===pet}}
    else if(e.state==="throw"){
      const aim=e.aimPet&&petCanBeHit()?pet:P;if(!e.thrownA&&e.timer<.56){spawnBolt(e.x+49,e.y-38,cx(aim),aim.y+aim.h*.45,565);e.thrownA=true}if(!e.thrownB&&e.timer<.28){spawnBolt(e.x+141,e.y-34,cx(aim),aim.y+aim.h*.45,530);e.thrownB=true}if(e.timer<=0)e.state="patrol";
    }else if(e.timer<=0)e.state="patrol";
  }
  function miniElephant(e,dt){
    if(hurtState(e,dt))return;const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h),dist=Math.abs(dx),wanted=Math.sign(dx)||e.dir;
    if(e.state==="leap"||e.state==="drop"){
      const previousBottom=e.y+e.h;e.vy=(e.vy||0)+1700*dt;e.y+=e.vy*dt;e.x+=clamp(cx(target)-cx(e),-1,1)*220*dt;
      if(!e.hit&&overlap(e,P)){hurt(cx(e),{horse:true,knockback:520,shieldKnockback:700,lift:-410,shieldLift:-270});e.hit=true}
      const landing=e.state==="leap"?e.arenaTop:e.arenaGround;if(e.vy>0&&previousBottom<=landing&&e.y+e.h>=landing){e.y=landing-e.h;e.vy=0;e.state="recover";e.timer=.55;e.cooldown=.65;shake(.22,5)}return;
    }
    if(e.state==="patrol"){
      const feet=e.y+e.h,playerFeet=P.y+P.h;if(playerFeet<e.arenaTop+35&&feet>e.arenaTop+80){e.state="leap";e.vy=-1080;e.hit=false;e.petHit=false;return}
      if(playerFeet>e.arenaTop+90&&feet<e.arenaTop+35){e.state="drop";e.vy=190;e.y+=10;e.hit=false;e.petHit=false;return}
      e.dir=wanted;if(dist<850&&Math.abs(dy)<190&&e.cooldown<=0){const attack=(e.attackIndex=(e.attackIndex||0)+1)%3;e.hit=false;e.petHit=false;
        if(attack===0&&dist>210){e.state="windup";e.timer=.65}else if(attack===1){e.state="stomp";e.timer=1.45;e.stomped=false}else{e.state="sweep";e.timer=1.05}
      }else e.x+=(e.dir*70+e.knock)*dt;
    }else if(e.state==="windup"&&e.timer<=0){e.state="charge";e.timer=1.25;e.anim=0}
    else if(e.state==="charge"){
      e.x+=e.dir*650*dt;const h={x:e.x-10,y:e.y+24,w:e.w+20,h:e.h-24};
      if(!e.hit&&overlap(h,P)){hurt(cx(e),{horse:true,knockback:590,shieldKnockback:820,lift:-410,shieldLift:-250});e.hit=true}if(!e.petHit&&petCanBeHit()&&overlap(h,pet)){hurtPet(cx(e),{knockback:590,lift:-410});e.petHit=true}
      if(e.timer<=0||e.x<=e.min||e.x+e.w>=e.max){e.state="recover";e.timer=.72;e.cooldown=1.05}
    }else if(e.state==="sweep"){
      if(e.timer<.64&&e.timer>.22){const h={x:e.dir>0?e.x+e.w-12:e.x-105,y:e.y+60,w:117,h:92};if(!e.hit&&overlap(h,P)){hurt(cx(e),{knockback:520,shieldKnockback:690,lift:-470,shieldLift:-330});e.hit=true}if(!e.petHit&&petCanBeHit()&&overlap(h,pet)){hurtPet(cx(e),{knockback:520,lift:-470});e.petHit=true}}if(e.timer<=0){e.state="recover";e.timer=.65;e.cooldown=.9}
    }else if(e.state==="stomp"){
      if(!e.stomped&&e.timer<.46){e.stomped=true;shake(.85,16);audio.play("stomp");spawnMiniShockwave(e)}if(e.timer<=0){e.state="recover";e.timer=.7;e.cooldown=1.1}
    }else if(e.state==="recover"&&e.timer<=0)e.state="patrol";
  }
  function spawnMiniShockwave(e){const dir=Math.sign(cx(P)-cx(e))||e.dir,ground=e.y+e.h,x=dir>0?e.x+e.w-15:e.x-62;shockwaves.push({x,y:ground-68,w:78,h:68,ground,dir,speed:720,life:1.05,maxLife:1.05,age:0,hit:false,petHit:false,dust:0,damage:true,blast:1.55});burst(x+(dir>0?20:58),ground-12,"#6f432f",30);burst(x+(dir>0?20:58),ground-22,"#c39a67",22)}
  function javelin(e,dt){
    if(hurtState(e,dt))return;const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h);
    if(e.state==="patrol"){e.dir=Math.sign(dx)||e.dir;if(Math.abs(dx)<650&&Math.abs(dy)<220&&e.cooldown<=0){e.state="throw";e.timer=.55;e.cooldown=1.8;e.thrown=false;e.aimPet=target===pet}else e.x+=(e.dir*32+e.knock)*dt}
    else if(e.state==="throw"){if(!e.thrown&&e.timer<.27){const aim=e.aimPet&&petCanBeHit()?pet:P;spawnBolt(cx(e),e.y+24,cx(aim),aim.y+aim.h*.45,540);e.thrown=true}if(e.timer<=0)e.state="patrol"}else if(e.timer<=0)e.state="patrol";
  }
  function gladiator(e,dt){
    if(hurtState(e,dt))return;const target=enemyAttackTarget(e),dx=cx(target)-cx(e),dy=(target.y+target.h)-(e.y+e.h);
    if(e.state==="patrol"){e.dir=Math.sign(dx)||e.dir;if(Math.abs(dx)<195&&Math.abs(dy)<130&&e.cooldown<=0){e.state="windup";e.timer=.48;e.hit=false;e.petHit=false}else e.x+=(e.dir*44+e.knock)*dt}
    else if(e.state==="windup"&&e.timer<=0){e.state="attack";e.timer=.52}
    else if(e.state==="attack"){if(e.timer<.35&&e.timer>.12){const h={x:e.dir>0?e.x+e.w-4:e.x-76,y:e.y+5,w:80,h:70};if(!e.hit&&overlap(h,P)){hurt(cx(e),{knockback:480,shieldKnockback:555,lift:-360});e.hit=true}if(!e.petHit&&petCanBeHit()&&overlap(h,pet)){hurtPet(cx(e),{knockback:480,lift:-360});e.petHit=true}}if(e.timer<=0){e.state="recover";e.timer=.65;e.cooldown=.75}}
    else if(["recover","block"].includes(e.state)&&e.timer<=0)e.state="patrol";
  }
  const JAVELIN_GRAVITY=42;
  function spawnBolt(x,y,tx,ty,speed=560){speed*=.67*.67;const dx=tx-x,dir=Math.sign(dx)||1,t=Math.max(.35,Math.abs(dx)/speed),w=51,h=13.5;bolts.push({x:x-w/2,y:y-h/2,w,h,vx:dir*speed,vy:(ty-y-.5*JAVELIN_GRAVITY*t*t)/t,life:Math.max(4.8,t+1.2),angle:0})}
  function updateProjectiles(dt){
    for(const b of bolts){b.life-=dt;b.vy+=JAVELIN_GRAVITY*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle=Math.atan2(b.vy,b.vx);if(b.life>0&&overlap(b,P)){hurt(b.x,{knockback:330,shieldKnockback:450,lift:-290});b.life=0}if(b.life>0&&petCanBeHit()&&overlap(b,pet)){hurtPet(b.x,{knockback:330,lift:-290});b.life=0}if(b.y>660||b.x< -100||b.x>level.width+100)b.life=0}bolts=bolts.filter(b=>b.life>0);
    for(const s of shots){s.life-=dt;s.vy+=430*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;let used=false;for(const e of enemies)if(!used&&e.alive&&overlap(s,e)){damageEnemy(e,attackDamage(),s.x,390);used=true}if(!used&&boss?.alive&&overlap(s,boss)){damageBoss(attackDamage(),s.x);used=true}if(used||s.y>640||s.x<0||s.x>level.width)s.life=0}shots=shots.filter(s=>s.life>0);
    for(const egg of eggShots){egg.life-=dt;egg.vy+=560*dt;egg.x+=egg.vx*dt;egg.y+=egg.vy*dt;egg.angle+=dt*(egg.vx>=0?7:-7);let used=false;for(const e of enemies)if(!used&&e.alive&&overlap(egg,e)){damageEnemy(e,PET_DAMAGE,egg.x,150);used=true}if(!used&&boss?.alive&&overlap(egg,boss)){damageBoss(PET_DAMAGE,egg.x);used=true}if(used){burst(egg.x+9,egg.y+11,"#eee7c9",9);audio.play("hit")}if(used||egg.y>660||egg.x<0||egg.x>level.width)egg.life=0}eggShots=eggShots.filter(egg=>egg.life>0);
  }
  function damageBoss(n,from){if(!boss?.alive||boss.flash>0)return;boss.hp-=n;boss.flash=.1;burst(clamp(from,boss.x,boss.x+boss.w),boss.y+120,"#7a242b",9);audio.play("hit");if(boss.hp<=0)phaseTwo()}
  function updateBoss(dt){
    if(!boss)return;if(!boss.alive){boss.deathFade=Math.max(0,boss.deathFade-dt*.62);return}boss.anim+=dt*(boss.state==="charge"?10:6);boss.timer-=dt;boss.throwCD-=dt;boss.flash=Math.max(0,boss.flash-dt);
    const dx=cx(P)-cx(boss),dist=Math.abs(dx);if(boss.state==="idle")boss.facing=Math.sign(dx)||boss.facing;
    if(dist>340&&dist<1050&&boss.throwCD<=0){const x=cx(boss)+boss.facing*12;spawnBolt(x-25,boss.y+54,cx(P),P.y+34,570);spawnBolt(x+28,boss.y+68,cx(P),P.y+44,525);boss.throwCD=2.65}
    if(boss.state==="idle"){if(boss.timer<=0)bossAttack(dist)}
    else if(boss.state==="windup"){if(boss.timer<=0){boss.state="charge";boss.timer=1.35;boss.anim=0;boss.hit=false;boss.petHit=false}}
    else if(boss.state==="charge"){const left=level.bossLeft??260,right=level.width-boss.w-70;boss.x+=boss.facing*650*dt;if(!boss.hit&&overlap({x:boss.x-12,y:boss.y+45,w:boss.w+24,h:boss.h-45},P)){hurt(cx(boss),{horse:true,knockback:700,shieldKnockback:940,lift:-470,shieldLift:-300});boss.hit=true}if(!boss.petHit&&petCanBeHit()&&overlap({x:boss.x-12,y:boss.y+45,w:boss.w+24,h:boss.h-45},pet)){hurtPet(cx(boss),{knockback:700,lift:-470});boss.petHit=true}boss.x=clamp(boss.x,left,right);if(boss.timer<=0||boss.x<=left||boss.x>=right)bossIdle(.8)}
    else if(boss.state==="sweep"){if(boss.timer<.68&&boss.timer>.25){const h={x:boss.facing>0?boss.x+boss.w-15:boss.x-150,y:boss.y+105,w:165,h:125};if(!boss.hit&&overlap(h,P)){hurt(cx(boss),{knockback:650,shieldKnockback:770,lift:-560,shieldLift:-390});boss.hit=true}if(!boss.petHit&&petCanBeHit()&&overlap(h,pet)){hurtPet(cx(boss),{knockback:650,lift:-560});boss.petHit=true}}if(boss.timer<=0)bossIdle(.75)}
    else if(boss.state==="stomp"){if(!boss.stomped&&boss.timer<.48){boss.stomped=true;shake(1.05,18);audio.play("stomp");spawnShockwave()}if(boss.timer<=0)bossIdle(.9)}
  }
  function bossAttack(dist){const c=boss.index++%3;if(dist<240||c===2){boss.state="sweep";boss.timer=1.15}else if(c===0){boss.state="windup";boss.timer=.65}else{boss.state="stomp";boss.timer=1.55;boss.stomped=false}boss.hit=false;boss.petHit=false}
  function bossIdle(t){boss.state="idle";boss.timer=t;boss.hit=false;boss.petHit=false}
  function spawnShockwave(){
    const dir=Math.sign(cx(P)-cx(boss))||boss.facing;boss.facing=dir;
    const x=dir>0?boss.x+boss.w-18:boss.x-52;
    shockwaves.push({x,y:535,w:70,h:55,ground:590,dir,speed:720,life:1.25,maxLife:1.25,age:0,hit:false,petHit:false,dust:0});
    burst(x+(dir>0?18:52),575,"#8a6544",14);
  }
  function updateShockwaves(dt){
    for(const w of shockwaves){
      w.age+=dt;w.life-=dt;w.x+=w.dir*w.speed*dt;w.dust-=dt;
      if(w.dust<=0){w.dust=w.blast?.035:.075;const px=w.x+(w.dir>0?w.w*.7:w.w*.3),count=w.blast?3:1;for(let i=0;i<count;i++)particles.push({x:px+(Math.random()-.5)*(w.blast?38:8),y:(w.ground??590)-6,color:Math.random()<.5?"#8a6544":"#c19a68",life:.3+Math.random()*(w.blast?.35:.2),vx:-w.dir*(30+Math.random()*(w.blast?170:80)),vy:-70-Math.random()*(w.blast?230:110),size:(w.blast?4:2)+Math.random()*(w.blast?6:4)})}
      if(!w.hit&&overlap(w,P)){w.hit=true;if(w.damage){hurt(w.x,{knockback:620,shieldKnockback:790,lift:-630,shieldLift:-420});shake(.42,13);burst(cx(P),P.y+P.h,"#7b4934",18)}else{P.vx=w.dir*560;P.vy=-660;P.grounded=false;P.onPlatform=null;P.lock=.62;shake(.35,11);burst(cx(P),P.y+P.h,"#9b744d",12)}}if(!w.petHit&&petCanBeHit()&&overlap(w,pet)){w.petHit=true;hurtPet(w.x,{knockback:w.damage?720:560,lift:w.damage?-780:-440})}
    }
    shockwaves=shockwaves.filter(w=>w.life>0&&w.x+w.w>0&&w.x<level.width);
  }
  function phaseTwo(){
    boss.alive=false;boss.deathFade=1;bossPhase=2;shockwaves=[];shake(1.2,25);audio.play("stomp");
    burst(cx(boss)-55,boss.y+125,"#8b2028",26);burst(cx(boss)+45,boss.y+155,"#6d171d",18);
    burst(cx(boss),boss.y+boss.h-12,"#76513b",42);burst(cx(boss),boss.y+boss.h-20,"#c29b68",30);
    for(let i=0;i<13;i++){const spread=(i-6)*31;coins.push({x:clamp(cx(boss)-12+spread,level.bossLeft+22,level.width-46),y:boss.y+105,w:24,h:24,taken:false,bob:i*.47,drop:true,vx:spread*.7+(Math.random()-.5)*55,vy:-390-Math.random()*210})}
    banner={text:"PHASE II",sub:"The surviving guard bursts from the tower!",time:3};
    const squad=[
      {type:"foot",w:48,h:78,y:512,hp:2,off:-125},
      {type:"gladiator",w:62,h:92,y:498,hp:3,off:-42},
      {type:"javelin",w:48,h:78,y:512,hp:2,off:42},
      {type:"foot",w:48,h:78,y:512,hp:2,off:125}
    ];
    for(const t of squad){
      const x=clamp(cx(boss)+t.off-t.w/2,150,level.width-150-t.w);
      const e=enemy({type:t.type,x,y:t.y,w:t.w,h:t.h,min:level.bossLeft||120,max:level.width-120,hp:t.hp,maxHp:t.hp,dir:t.off<0?-1:1});
      e.state="hurt";e.timer=.42;e.knock=(t.off<0?-1:1)*360;e.cooldown=.55;enemies.push(e);
      burst(cx(e),e.y+e.h*.55,t.type==="gladiator"?"#d2a341":"#8a6a47",9);
    }
  }
  function update(dt){
    if(paused)return;
    elapsed+=dt;if(!running)return;
    if(creative.active&&creative.infiniteStones)P.ammo=MAX_AMMO;
    shop.near=shopIsNear();if(shop.open||inventory.open)return;
    if(banner&&(banner.time-=dt)<=0)banner=null;
    if(shakeTime>0){shakeTime-=dt;shakePower*=Math.pow(.12,dt)}else shakePower=0;
    if(li===1&&level.shakeEvery&&(tremor-=dt)<=0){tremor=level.shakeEvery+Math.random()*4-2;shake(.85,11);audio.play("stomp");banner={text:"THE GROUND TREMBLES",sub:"Something immense waits ahead�",time:1.5}}
    movePlatforms(dt);updatePlayer(dt);updatePet(dt);updateEnemies(dt);updateBoss(dt);updateShockwaves(dt);updateProjectiles(dt);
    for(const p of particles){p.life-=dt;p.vy+=480*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}particles=particles.filter(p=>p.life>0);
    if(level.boss&&bossPhase===2&&enemies.every(e=>!e.alive)&&!creative.active){if(level.campaignEnd)victory();else complete()}
    const zoom=level.zoom||1,viewW=1280/zoom,viewH=720/zoom;camera+=(clamp(cx(P)-viewW*.38,0,Math.max(0,level.width-viewW))-camera)*clamp(dt*5,0,1);const targetY=level.height?clamp(P.y+P.h*.5-viewH*.58,0,Math.max(0,level.height-viewH)):720-viewH;cameraY+=(targetY-cameraY)*clamp(dt*5,0,1);
  }
  Object.assign(G,{loadLevel,update,hurt,damageBoss,startAttack,throwStone,startPetting});
  loadLevel(0,true);
})();







