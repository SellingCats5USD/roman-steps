(() => {
  const P = (x,y,w,h=34,ground=false) => ({x,y,w,h,ground});
  const M = (x,y,w,axis,range,speed,phase=0) => ({
    x,y,w,h:30,ground:false,moving:true,axis,range,speed,phase,baseX:x,baseY:y,dx:0,dy:0
  });
  const foot = (x,min,max) => ({type:"foot",x,y:512,w:48,h:78,min,max,hp:1,maxHp:1});
  const mounted = (x,min,max,hp=4) => ({type:"mounted",x,y:510,w:104,h:80,min,max,hp,maxHp:hp});
  const javelin = (x,min,max) => ({type:"javelin",x,y:512,w:48,h:78,min,max,hp:1,maxHp:1});
  const gladiator = (x,min,max) => ({type:"gladiator",x,y:498,w:62,h:92,min,max,hp:3,maxHp:3});
  const miniElephant = (x,min,max,hp=12) => ({type:"miniElephant",x,y:459,w:215,h:161,min,max,hp,maxHp:hp,arenaTop:330,arenaGround:620});
  const tower = (x,hp=9) => ({type:"tower",x,y:512,w:190,h:250,min:x,max:x+190,hp,maxHp:hp});

  window.CAMPAIGN_LEVELS = [
    {
      name:"Via Aurelia", subtitle:"Province I", width:5200, start:{x:120,y:400},
      platforms:[
        P(0,590,850,130,true),P(970,590,690,130,true),P(1770,590,820,130,true),
        P(2710,590,520,130,true),P(3360,590,700,130,true),P(4190,590,1010,130,true),
        P(430,440,210),P(1080,445,180),P(1370,350,175),P(1900,430,200),
        P(2210,335,210),P(2800,430,170),P(3450,425,230),P(3780,315,150),
        P(4330,440,190),P(4620,345,170)
      ],
      bushes:[280,1140,1520,1980,2460,2870,3500,3970,4400,4880],
      statues:[{x:670,y:315,w:155,h:275}],
      bananas:[[1000,530]],
      enemies:[
        foot(690,540,800),foot(1190,1000,1380),foot(2030,1790,2500),
        foot(2880,2730,3160),foot(3600,3380,3740),foot(4440,4210,4830),
        mounted(1300,995,1640,4),mounted(3680,3380,4040,5),
        javelin(2380,2140,2525),javelin(4700,4380,4940)
      ],
      coins:[[350,520],[480,375],[550,375],[620,375],[1050,520],[1130,380],[1210,380],
        [1398,285],[1470,285],[1840,520],[1945,365],[2025,365],[2250,270],[2340,270],
        [2780,520],[2840,365],[2920,365],[3410,520],[3500,350],[3580,350],[3820,250],
        [4260,520],[4370,375],[4450,375],[4660,280],[4735,280],[4890,520]],
      stones:[], sling:null, shakeEvery:0
    },
    {
      name:"Road to Zama", subtitle:"Province II", width:6800, start:{x:120,y:400},
      shop:{x:170,y:394,w:294,h:196}, shopIntro:520,
      platforms:[
        P(0,590,900,130,true),P(1040,590,760,130,true),P(1930,590,770,130,true),
        P(2850,590,650,130,true),P(3660,590,740,130,true),P(4560,590,740,130,true),
        P(5460,590,740,130,true),P(6350,590,450,130,true),
        P(420,435,190),P(1130,445,190),P(1450,345,185),P(2070,430,210),
        P(2380,330,220),P(3000,430,190),P(3810,420,220),P(4140,315,180),
        P(4700,440,210),P(5020,340,210),P(5600,425,210),P(5920,320,190),
        M(850,390,150,"x",145,1.45),M(2690,425,150,"y",95,1.25,1.2),
        M(4380,385,155,"x",150,1.55,2.1),M(6190,410,145,"y",90,1.35,.8)
      ],
      bushes:[260,760,1110,1650,2050,2560,2920,3400,3720,4250,4620,5150,5520,6120,6500],
      bananas:[[4820,530]],
      enemies:[
        foot(720,500,850),foot(1280,1060,1700),foot(2180,1950,2630),foot(3220,2870,3460),
        foot(4020,3680,4320),foot(4900,4580,5260),foot(5700,5480,6150),foot(6540,6370,6750),
        mounted(1425,1050,1780,5),mounted(4860,4580,5280,5),
        javelin(2480,2000,2650),javelin(5150,4650,5280),
        gladiator(3370,2920,3470),gladiator(5990,5520,6150)
      ],
      coins:[[320,520],[470,370],[550,370],[1150,380],[1240,380],[1490,280],[1580,280],
        [2010,520],[2120,365],[2230,365],[2420,265],[2540,265],[2910,520],[3060,365],
        [3740,520],[3860,355],[3970,355],[4180,250],[4280,250],[4630,520],[4740,375],
        [4850,375],[5060,275],[5180,275],[5520,520],[5650,360],[5960,255],[6100,255],
        [6420,520],[6600,520]],
      stones:[[3550,520],[3900,355],[4250,250],[4770,375],[5200,275],[5660,360],[6080,255],[6500,520]],
      sling:{x:3300,y:520}, shakeEvery:11
    },
    {
      name:"The Beast of Zama", subtitle:"Province III - Boss", width:3000, start:{x:120,y:230},
      shop:{x:170,y:164,w:294,h:196}, bossLeft:840,
      platforms:[
        P(0,360,760,34),P(760,590,2240,130,true),
        P(1010,455,250),P(1345,335,240),P(1665,215,270),
        P(2055,350,250),P(2380,410,250),P(2680,295,250)
      ],
      ladders:[
        {x:735,y:360,w:58,h:230},{x:1105,y:455,w:58,h:135},
        {x:2145,y:350,w:58,h:240}
      ],
      bushes:[970,1510,2220,2790], bananas:[[1450,281],[2735,241]], bananaRespawn:35,
      enemies:[
        {...foot(1120,1025,1245),y:377},
        {...foot(1435,1360,1570),y:257},
        {...foot(1745,1680,1920),y:137},
        {...foot(2760,2695,2915),y:217}
      ], coins:[],
      stones:[[1120,405],[1450,285],[1800,165],[2160,300],[2490,360],[2790,245]], sling:null, shakeEvery:0, boss:true
    },
    {
      name:"Carthage Citadel", subtitle:"Province IV", width:7600, start:{x:120,y:400}, zoom:.82,
      shop:{x:170,y:364,w:294,h:196}, shopIntro:520,
      platforms:[
        P(0,560,820,160,true),P(960,540,620,180,true),P(1740,565,640,155,true),
        P(2540,525,620,195,true),P(3330,550,610,170,true),P(4120,515,620,205,true),
        P(4920,545,640,175,true),P(5600,620,1860,100,true),P(7460,535,140,185,true),
        P(350,435,180),P(1080,420,175),P(1390,320,170),P(1840,430,185),
        P(2170,325,175),P(2670,420,180),P(2980,315,165),P(3440,430,185),
        P(3770,325,170),P(4240,415,180),P(5030,430,180),
        P(5360,325,170),P(5600,330,1860),
        M(810,395,145,"x",150,1.7),M(1580,410,145,"y",105,1.45,.7),
        M(2380,380,150,"x",160,1.8,1.4),M(3160,420,145,"y",110,1.55,2.2),
        M(4740,385,150,"x",165,1.9,.9)
      ],
      ladders:[{x:5780,y:330,w:58,h:290},{x:6480,y:330,w:58,h:290},{x:7180,y:330,w:58,h:290}],
      bushes:[240,690,1040,1480,1810,2280,2630,3090,3390,3890,4210,4680,5010,5480],
      bananas:[[6040,270]],
      enemies:[
        foot(650,470,790),foot(1170,980,1510),foot(1900,1760,2320),foot(2760,2560,3110),
        foot(3500,3350,3890),foot(4300,4140,4680),foot(5100,4940,5500),
        mounted(1310,980,1560,6),mounted(3690,3350,3930,6),tower(4460,9),
        miniElephant(5900,5620,7440,12),miniElephant(6900,5620,7440,12),
        javelin(2220,1770,2340),javelin(3030,2580,3120),javelin(4620,4160,4700),
        gladiator(1510,1000,1560),gladiator(2860,2570,3120),gladiator(5200,4950,5500)
      ],
      coins:[[300,490],[390,370],[470,370],[1010,470],[1120,355],[1210,355],[1425,255],[1510,255],
        [1800,495],[1880,365],[1980,365],[2200,260],[2300,260],[2600,455],[2710,355],[2810,355],
        [3010,250],[3100,250],[3390,480],[3490,365],[3600,365],[3800,260],[3890,260],[4180,445],
        [4290,350],[4400,350],[4610,240],[4700,240],[4980,475],[5070,365],[5180,365],[5390,260],
        [5480,260],[5790,550],[5900,265],[6100,265],[6300,265],[6500,265],[6700,265],[6900,265],
        [7100,265],[7300,265],[7520,465]],
      stones:[[720,490],[1490,255],[2290,260],[3090,250],[3880,260],[4690,240],[5470,260],[6100,265],[6700,265],[7300,265]],
      sling:null, shakeEvery:0, requiresElephants:true
    },
    {
      name:"The Walls of Carthage", subtitle:"Province V - Final Siege", width:9000, start:{x:120,y:400}, zoom:.78,
      shop:{x:170,y:359,w:294,h:196}, shopIntro:520,
      platforms:[
        P(0,555,900,165,true),P(1050,525,720,195,true),P(1930,570,700,150,true),
        P(2790,520,690,200,true),P(3640,550,720,170,true),P(4520,510,680,210,true),
        P(5360,560,720,160,true),P(6240,515,720,205,true),P(7120,550,720,170,true),
        P(8000,500,1000,220,true),
        P(350,405,220),P(1160,390,220),P(1460,285,210),P(2070,420,220),
        P(2370,310,220),P(2900,365,220),P(3260,255,220),
        P(4130,295,220),P(4630,360,220),P(4970,245,220),
        P(5490,410,220),P(5820,295,220),P(6350,360,220),P(6710,245,220),
        P(7570,285,220),P(8140,350,220),P(8490,235,220),P(8800,345,180),
        M(900,410,150,"x",150,1.9),M(1770,390,150,"y",100,1.65,.6),
        M(2630,380,150,"x",155,2.0,1.1),M(3480,400,150,"y",105,1.75,1.7),
        M(4360,370,150,"x",160,2.05,.4),M(5200,390,150,"y",105,1.8,1.3),
        M(6080,375,150,"x",165,2.1,2),M(6960,390,150,"y",105,1.85,.8),
        M(7840,365,150,"x",165,2.15,1.5)
      ],
      ladders:[
        {x:1240,y:390,w:58,h:135},{x:1540,y:285,w:58,h:240},
        {x:2440,y:310,w:58,h:260},{x:3340,y:255,w:58,h:265},
        {x:4200,y:295,w:58,h:255},{x:5050,y:245,w:58,h:265},
        {x:5890,y:295,w:58,h:265},{x:6780,y:245,w:58,h:270},
        {x:7640,y:285,w:58,h:265},{x:8560,y:235,w:58,h:265}
      ],
      bushes:[260,720,1120,1680,2010,2580,2860,3520,3700,4420,4580,5280,5420,6160,6310,7040,7160,7920,8070,8880],
      bananas:[[4860,450],[8360,440]],
      enemies:[
        foot(720,500,870),foot(1320,1080,1720),foot(2200,1960,2600),
        foot(3000,2820,3440),foot(4200,3670,4330),foot(4800,4550,5150),
        foot(5650,5390,6030),foot(6500,6270,6920),foot(7600,7150,7800),
        foot(8300,8030,8680),foot(8900,8720,8970),
        mounted(1500,1080,1730,7),mounted(4700,4550,5170,7),mounted(8150,8020,8700,8),
        tower(3870,11),tower(7350,12),
        javelin(2450,1980,2610),javelin(3350,2820,3460),javelin(5050,4550,5180),
        javelin(6800,6270,6940),javelin(8650,8030,8720),
        gladiator(1650,1090,1740),gladiator(3420,2830,3470),gladiator(5900,5400,6050),
        gladiator(7750,7140,7820),gladiator(8950,8730,8990)
      ],
      coins:[
        [310,485],[430,340],[520,340],[1110,455],[1220,325],[1510,220],[1600,220],
        [1990,500],[2110,355],[2420,245],[2510,245],[2850,450],[2960,300],[3310,190],[3400,190],
        [3700,480],[4160,230],[4250,230],[4580,440],[4680,295],[5020,180],[5110,180],
        [5410,490],[5540,345],[5870,230],[5960,230],[6290,445],[6400,295],[6750,180],[6840,180],
        [7170,480],[7610,220],[7700,220],[8050,430],[8170,285],[8530,170],[8620,170],
        [8830,280],[8920,280],[8970,430]
      ],
      stones:[[760,485],[1550,220],[2230,500],[3340,190],[4240,230],[5060,180],[5880,230],[6760,180],[7620,220],[8200,285],[8550,170],[8920,430]],
      sling:null, shakeEvery:0
    },
    {
      name:"The Eagle's Ascent", subtitle:"Province VI - Tower of the Eagle", width:1800, height:3200, start:{x:110,y:2980}, zoom:.72,
      platforms:[
        P(0,3100,1800,150,true),
        P(180,2960,250),P(420,2825,320),P(700,2690,340),P(980,2555,300),
        P(920,2350,420),P(620,2215,300),P(330,2080,300),P(100,1945,300),
        M(430,1800,250,"x",125,1.1,.4),P(60,1660,350),P(360,1515,420),
        P(700,1370,360),P(1040,1225,350),P(1300,1080,360),
        P(1240,800,400),P(950,660,300),P(650,520,300),P(350,380,300),P(650,240,430),
        M(1060,940,220,"x",150,1.25,1.4),M(720,1110,210,"y",95,1.2,2.2)
      ],
      ladders:[
        {x:700,y:2690,w:40,h:135},{x:990,y:2555,w:50,h:135},{x:1120,y:2350,w:58,h:205},
        {x:170,y:1660,w:58,h:285},{x:710,y:1370,w:58,h:145},{x:1320,y:800,w:58,h:280}
      ],
      bushes:[90,330,620,1010,1390,1680],
      bananas:[[1480,1020],[720,180]],
      enemies:[
        {...foot(520,440,650),y:2747},
        {...javelin(1040,940,1260),y:2272},
        {...foot(400,330,580),y:2002},
        {...javelin(1120,1040,1330),y:1147},
        {...gladiator(760,680,930),y:1278}
      ],
      coins:[
        [230,2900],[470,2765],[750,2630],[1030,2495],[1160,2290],[680,2155],[390,2020],[150,1885],
        [480,1740],[120,1600],[420,1455],[760,1310],[1100,1165],[1360,1020],[1300,740],[1010,600],
        [710,460],[410,320],[710,180],[850,180],[990,180]
      ],
      stones:[[760,2630],[1020,2290],[380,2020],[430,1455],[1090,1165],[1000,600]],
      finish:{x:790,y:35,w:170,h:205},sling:null,shakeEvery:0,campaignEnd:true
    },
    {
      name:"Ladder Lab", subtitle:"Developer Level", width:2200, start:{x:440,y:400}, devOnly:true,
      platforms:[
        P(0,590,2200,130,true),
        P(430,350,360),P(980,245,390),P(1510,370,360),
        P(1910,285,210)
      ],
      ladders:[
        {x:555,y:350,w:58,h:240},
        {x:1125,y:245,w:58,h:345},
        {x:1635,y:370,w:58,h:220},
        {x:1980,y:285,w:58,h:305}
      ],
      shop:{x:110,y:394,w:294,h:196},
      bushes:[240,820,1430,2070],enemies:[foot(2070,1940,2180)],coins:[],stones:[],sling:null,shakeEvery:0
    }
  ];

  for(const level of window.CAMPAIGN_LEVELS){
    const d=level.shopIntro||0;if(!d)continue;level.width+=d;
    level.platforms=level.platforms.map(p=>{const q={...p};if(q.ground&&q.x===0)q.w+=d;else{q.x+=d;if(q.moving)q.baseX+=d}return q});
    if(level.ladders)level.ladders=level.ladders.map(l=>({...l,x:l.x+d}));
    const groundAt=x=>level.platforms.find(p=>p.ground&&x>=p.x&&x<=p.x+p.w)?.y;
    level.bushes=level.bushes.map(x=>x+d);
    level.enemies=level.enemies.map(e=>{const q={...e,x:e.x+d,min:e.min+d,max:e.max+d},gy=groundAt(e.x+d+e.w/2);if(gy!=null&&q.y>=400)q.y=gy-q.h;return q});
    level.coins=level.coins.map(([x,y])=>{x+=d;const gy=groundAt(x);return[x,y>=500&&gy!=null?gy-70:y]});level.stones=level.stones.map(([x,y])=>{x+=d;const gy=groundAt(x);return[x,y>=500&&gy!=null?gy-70:y]});
    level.bananas=(level.bananas||[]).map(([x,y])=>{x+=d;const gy=groundAt(x);return[x,y>=500&&gy!=null?gy-60:y]});
    if(level.sling)level.sling={...level.sling,x:level.sling.x+d};
  }

  class RomanAudioEngine {
    constructor(){this.ctx=null;this.master=null;this.music=null;this.sfx=null;this.timer=null;this.step=0;this.muted=false;}
    ensure(){
      if(!this.ctx){
        const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
        this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=.42;this.master.connect(this.ctx.destination);
        this.music=this.ctx.createGain();this.music.gain.value=.22;this.music.connect(this.master);
        this.sfx=this.ctx.createGain();this.sfx.gain.value=.65;this.sfx.connect(this.master);
      }
      if(this.ctx.state==="suspended")this.ctx.resume();
      if(!this.timer){this.timer=setInterval(()=>this.beat(),285);this.beat();}
    }
    tone(freq,dur=.18,type="triangle",gain=.08,dest=this.music,when=0){
      if(!this.ctx||this.muted)return;
      const t=this.ctx.currentTime+when,o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03);
    }
    noise(dur=.08,gain=.06,when=0){
      if(!this.ctx||this.muted)return;
      const n=Math.max(1,Math.floor(this.ctx.sampleRate*dur)),b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=b.getChannelData(0);
      for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
      const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=b;g.gain.value=gain;s.connect(g);g.connect(this.sfx);s.start(this.ctx.currentTime+when);
    }
    beat(){
      if(!this.ctx||this.muted)return;
      const scale=[146.83,174.61,196,220,261.63,293.66,349.23,392];
      const melody=[0,2,3,2,5,3,2,0,0,2,6,5,3,2,1,0];
      const i=this.step++%melody.length;
      this.tone(scale[melody[i]],.21,"triangle",.07);
      if(i%2===0)this.tone(scale[melody[i]]*2,.08,"sine",.025,this.music,.04);
      if(i%4===0){this.tone(73.42,.55,"sawtooth",.035);this.noise(.055,.035);}
      if(i%8===4)this.tone(98,.4,"triangle",.045);
    }
    play(name){
      this.ensure();if(!this.ctx)return;
      if(name==="attack"){this.tone(220,.07,"square",.11,this.sfx);this.tone(520,.09,"sawtooth",.06,this.sfx,.04);}
      else if(name==="block"){this.tone(130,.16,"square",.12,this.sfx);this.tone(860,.09,"triangle",.08,this.sfx,.02);this.noise(.06,.07);}
      else if(name==="break"){this.tone(105,.35,"sawtooth",.13,this.sfx);this.noise(.2,.12);}
      else if(name==="sling"){this.tone(740,.06,"triangle",.07,this.sfx);this.tone(330,.12,"triangle",.05,this.sfx,.05);}
      else if(name==="hit"){this.tone(82,.2,"square",.1,this.sfx);this.noise(.1,.07);}
      else if(name==="stomp"){this.tone(45,.55,"sine",.22,this.sfx);this.noise(.32,.17);}
      else if(name==="pickup"){this.tone(523,.1,"triangle",.06,this.sfx);this.tone(784,.18,"triangle",.06,this.sfx,.08);}
    }
    toggle(){this.ensure();this.muted=!this.muted;if(this.master)this.master.gain.value=this.muted?0:.42;return this.muted;}
  }
  window.RomanAudio=new RomanAudioEngine();
})();



