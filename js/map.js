// ── map.js ────────────────────────────────────────────────────────
import { getWorldConfig, LEVELS_PER_CP, TOTAL_CHECKPOINTS } from './world-config.js';

const TEST_MODE = true;
const TOTAL_LEVELS = TOTAL_CHECKPOINTS * LEVELS_PER_CP;

function hexToInt(hex) { return parseInt(hex.replace('#',''), 16); }
function hexToRGB(hex) {
  const n = parseInt(hex.replace('#',''), 16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}
function lightenInt(col, amt) {
  return (Math.min(255,((col>>16)&255)+amt)<<16)|(Math.min(255,((col>>8)&255)+amt)<<8)|(Math.min(255,(col&255)+amt));
}
function darkenInt(col, amt) {
  return (Math.max(0,((col>>16)&255)-amt)<<16)|(Math.max(0,((col>>8)&255)-amt)<<8)|(Math.max(0,(col&255)-amt));
}
function seededRng(seed) {
  let s = seed;
  return () => { s=(s*16807)%2147483647; return (s-1)/2147483646; };
}
function getProgress() {
  try { return JSON.parse(localStorage.getItem('matrushka_progress')||'{}'); }
  catch(e) { return {}; }
}
function saveProgress(n) {
  const p = getProgress();
  p.completedLevel = Math.max(p.completedLevel||0, n);
  localStorage.setItem('matrushka_progress', JSON.stringify(p));
}

// ── Top çizimi ────────────────────────────────────────────────────
function drawBall(g, cx, cy, R, col) {
  const hi = lightenInt(col, 70);
  g.beginFill(col); g.drawCircle(cx, cy, R); g.endFill();
  g.beginFill(hi, 0.50); g.drawEllipse(cx-R*.25, cy-R*.28, R*.38, R*.22); g.endFill();
  g.beginFill(hi, 0.18); g.drawEllipse(cx+R*.16, cy+R*.26, R*.14, R*.09); g.endFill();
}

// ── Hayvan çizimi ─────────────────────────────────────────────────
function drawAnimal(g, shape, col, cx, cy, R, flipX) {
  const hi  = lightenInt(col, 65);
  const mid = col;
  const sx  = flipX ? -1 : 1;
  switch (shape) {
    case 'jellybear':
    case 'bear': {
      g.beginFill(darkenInt(col,30)); g.drawCircle(cx+sx*R*.36,cy+R*.70,R*.20); g.endFill();
      g.beginFill(darkenInt(col,30)); g.drawCircle(cx-sx*R*.36,cy+R*.70,R*.20); g.endFill();
      g.beginFill(mid); g.drawCircle(cx+sx*R*.70,cy+R*.08,R*.18); g.endFill();
      g.beginFill(mid); g.drawCircle(cx-sx*R*.70,cy+R*.08,R*.18); g.endFill();
      g.beginFill(mid); g.drawCircle(cx+sx*R*.34,cy-R*.70,R*.18); g.endFill();
      g.beginFill(mid); g.drawCircle(cx-sx*R*.34,cy-R*.70,R*.18); g.endFill();
      g.beginFill(darkenInt(col,20)); g.drawCircle(cx+sx*R*.34,cy-R*.70,R*.10); g.endFill();
      g.beginFill(darkenInt(col,20)); g.drawCircle(cx-sx*R*.34,cy-R*.70,R*.10); g.endFill();
      g.beginFill(mid); g.drawCircle(cx,cy+R*.12,R*.70); g.endFill();
      g.beginFill(hi,0.28); g.drawEllipse(cx-sx*R*.18,cy-R*.05,R*.28,R*.18); g.endFill();
      g.beginFill(mid); g.drawCircle(cx,cy-R*.38,R*.46); g.endFill();
      g.beginFill(hi,0.35); g.drawEllipse(cx-sx*R*.12,cy-R*.52,R*.18,R*.12); g.endFill();
      g.beginFill(0x111111); g.drawCircle(cx+sx*R*.14,cy-R*.42,R*.066); g.endFill();
      g.beginFill(0x111111); g.drawCircle(cx-sx*R*.14,cy-R*.42,R*.066); g.endFill();
      g.beginFill(0xffffff); g.drawCircle(cx+sx*R*.11,cy-R*.46,R*.026); g.endFill();
      g.beginFill(0xffffff); g.drawCircle(cx-sx*R*.17,cy-R*.46,R*.026); g.endFill();
      g.beginFill(0x222222); g.drawEllipse(cx,cy-R*.27,R*.050,R*.035); g.endFill();
      g.beginFill(0xff8888,0.35); g.drawEllipse(cx+sx*R*.28,cy-R*.32,R*.12,R*.08); g.endFill();
      g.beginFill(0xff8888,0.35); g.drawEllipse(cx-sx*R*.28,cy-R*.32,R*.12,R*.08); g.endFill();
      break;
    }
    case 'matrushka': {
      g.beginFill(mid); g.drawEllipse(cx,cy+R*.18,R*.70,R*.76); g.endFill();
      g.beginFill(hi,0.40); g.drawEllipse(cx,cy+R*.22,R*.30,R*.40); g.endFill();
      g.beginFill(hi,0.70); g.drawEllipse(cx,cy-R*.05,R*.54,R*.09); g.endFill();
      g.beginFill(darkenInt(col,22),0.72); g.drawEllipse(cx,cy-R*.52,R*.30,R*.10); g.endFill();
      g.beginFill(mid); g.drawCircle(cx,cy-R*.38,R*.36); g.endFill();
      g.beginFill(hi,0.42); g.drawEllipse(cx-sx*R*.10,cy-R*.50,R*.16,R*.10); g.endFill();
      g.beginFill(0x111111); g.drawCircle(cx+sx*R*.09,cy-R*.40,R*.050); g.endFill();
      g.beginFill(0x111111); g.drawCircle(cx-sx*R*.09,cy-R*.40,R*.050); g.endFill();
      g.beginFill(0xff9966,0.38); g.drawEllipse(cx+sx*R*.20,cy-R*.33,R*.11,R*.07); g.endFill();
      g.beginFill(0xff9966,0.38); g.drawEllipse(cx-sx*R*.20,cy-R*.33,R*.11,R*.07); g.endFill();
      break;
    }
    case 'duck': {
      const hx=cx+sx*R*.42, hy=cy-R*.52;
      g.beginFill(mid); g.drawEllipse(cx,cy+R*.08,R*.80,R*.70); g.endFill();
      g.beginFill(hi,0.26); g.drawEllipse(cx-sx*R*.10,cy-R*.06,R*.36,R*.24); g.endFill();
      g.beginFill(darkenInt(col,18));
      g.moveTo(hx-sx*R*.04,hy-R*.46); g.bezierCurveTo(hx-sx*R*.12,hy-R*.84,hx+sx*R*.10,hy-R*.88,hx+sx*R*.07,hy-R*.46);
      g.closePath(); g.endFill();
      g.beginFill(mid); g.drawCircle(hx,hy,R*.30); g.endFill();
      g.beginFill(0xe65100);
      g.moveTo(hx+sx*R*.22,hy-R*.02); g.bezierCurveTo(hx+sx*R*.36,hy,hx+sx*R*.60,hy-R*.01,hx+sx*R*.66,hy-R*.07);
      g.bezierCurveTo(hx+sx*R*.68,hy-R*.13,hx+sx*R*.61,hy-R*.17,hx+sx*R*.22,hy-R*.13); g.closePath(); g.endFill();
      g.beginFill(0xffffff); g.drawCircle(hx+sx*R*.08,hy-R*.07,R*.10); g.endFill();
      g.beginFill(0x111111); g.drawCircle(hx+sx*R*.10,hy-R*.06,R*.060); g.endFill();
      g.beginFill(0xff8c00); g.drawEllipse(cx-sx*R*.16,cy+R*1.0,R*.26,R*.09); g.endFill();
      g.beginFill(0xff8c00); g.drawEllipse(cx+sx*R*.16,cy+R*1.0,R*.26,R*.09); g.endFill();
      break;
    }
    case 'fish': {
      g.beginFill(darkenInt(col,20));
      g.moveTo(cx-sx*R*.60,cy); g.bezierCurveTo(cx-sx*R*1.02,cy-R*.58,cx-sx*R*1.38,cy-R*.40,cx-sx*R*1.28,cy);
      g.bezierCurveTo(cx-sx*R*1.38,cy+R*.40,cx-sx*R*1.02,cy+R*.58,cx-sx*R*.60,cy); g.closePath(); g.endFill();
      g.beginFill(hi,0.40);
      g.moveTo(cx-sx*R*.62,cy); g.bezierCurveTo(cx-sx*R*.95,cy-R*.18,cx-sx*R*1.14,cy-R*.09,cx-sx*R*1.06,cy);
      g.bezierCurveTo(cx-sx*R*1.14,cy+R*.09,cx-sx*R*.95,cy+R*.18,cx-sx*R*.62,cy); g.closePath(); g.endFill();
      g.beginFill(mid); g.drawEllipse(cx+sx*R*.04,cy,R*.88,R*.76); g.endFill();
      g.beginFill(darkenInt(col,16));
      g.moveTo(cx+sx*R*.07,cy-R*.70); g.bezierCurveTo(cx+sx*R*.30,cy-R*1.12,cx+sx*R*.60,cy-R*1.00,cx+sx*R*.52,cy-R*.70);
      g.closePath(); g.endFill();
      g.beginFill(0xffffff); g.drawCircle(cx+sx*R*.46,cy-R*.22,R*.20); g.endFill();
      g.beginFill(0x111111); g.drawCircle(cx+sx*R*.50,cy-R*.20,R*.12); g.endFill();
      g.beginFill(0xffffff); g.drawCircle(cx+sx*R*.45,cy-R*.25,R*.038); g.endFill();
      g.beginFill(hi,0.45); g.drawEllipse(cx-sx*R*.04,cy-R*.26,R*.26,R*.17); g.endFill();
      break;
    }
    default: case 'sphere': {
      g.beginFill(mid); g.drawCircle(cx,cy,R); g.endFill();
      g.beginFill(hi,0.46); g.drawEllipse(cx-sx*R*.24,cy-R*.28,R*.36,R*.20); g.endFill();
      break;
    }
  }
}

// ── MapScreen ─────────────────────────────────────────────────────
// Kullanım (index.html veya başlatıcı):
//   const game = new Game(canvas);
//   const map  = new MapScreen(game);
//   window._matrushkaMap = map;          // game.js _nextLevel için
//   map.show();                          // haritayı göster
//
// Node tıklaması → map._onNodeTap(li) → game.startFromLevel(li+1)
// Callback zinciri, global window._matrushkaGame yok.
export class MapScreen {
  constructor(game) {
    this._game        = game;  // Game instance — doğrudan referans
    this._app         = null;
    this._div         = null;
    this._nodes       = [];
    this._walkers     = [];
    this._bgParticles = [];
    this._pathPts     = [];
    this._scrollY     = 0;
    this._targetY     = 0;
    this._worldH      = 0;
    this._bgRGB       = { r:5, g:8, b:18 };
    this._rain        = [];
    this._rainOn      = false;
    this._rainCols    = [];
    this._contBtn     = null;
    this._built       = false;
    this._time        = 0;
  }

  // ── Public API ────────────────────────────────────────────────────

  show() {
    this._build();
    this._refreshNodes();
    this._div.style.display = 'block';
    requestAnimationFrame(() => { this._div.style.opacity = '1'; });
  }

  hide() {
    if (!this._div) return;
    this._div.style.opacity = '0';
    setTimeout(() => { if (this._div) this._div.style.display = 'none'; }, 400);
  }

  showCheckpoint(cpIdx, onDone) {
    saveProgress((cpIdx + 1) * LEVELS_PER_CP);
    this._build();
    this._refreshNodes();
    this._div.style.display = 'block';
    requestAnimationFrame(() => { this._div.style.opacity = '1'; });
    const H = this._app.screen.height;
    const lastNode = this._nodes[(cpIdx + 1) * LEVELS_PER_CP - 1];
    if (lastNode) this._targetY = Math.max(0, Math.min(this._worldH - H, lastNode.worldY - H * 0.5));
    this._rainOn   = true;
    this._rainCols = getWorldConfig(cpIdx).palette;
    setTimeout(() => { this._showContBtn(onDone); }, 2500);
  }

  // ── Node tıklama ──────────────────────────────────────────────────
  // li = 0-indexed harita node
  // internalLevel = li + 1 (tutorial=0 hariç, game levels 1..N)
  _onNodeTap(li) {
    const internalLevel = li + 1;
    if (this._div) {
      this._div.style.transition = 'none';
      this._div.style.opacity = '0';
      this._div.style.display = 'none';
    }
    const game = this._game || window._matrushkaGame;
    if (!game) { console.error('MapScreen: game referansı yok'); return; }
    game.startFromLevel(internalLevel);
  }

  // ── Build ─────────────────────────────────────────────────────────
  _build() {
    if (this._built) return;
    this._built = true;

    const app = new PIXI.Application({
      width: window.innerWidth, height: window.innerHeight,
      antialias: true, resolution: window.devicePixelRatio||1, autoDensity: true,
    });
    app.renderer.background.alpha = 0;

    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
      z-index:100;display:none;opacity:0;transition:opacity 0.4s;`;
    div.appendChild(app.view);
    app.view.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
    document.body.appendChild(div);

    const bgCanvas = document.createElement('canvas');
    bgCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    div.insertBefore(bgCanvas, app.view);
    app.view.style.position = 'relative'; app.view.style.zIndex = '1';

    this._app = app; this._div = div;
    this._bgCanvas = bgCanvas; this._bgCtx = bgCanvas.getContext('2d');

    this._layerBg    = new PIXI.Container();
    this._layerPath  = new PIXI.Container();
    this._layerNodes = new PIXI.Container();
    this._layerWalk  = new PIXI.Container();
    this._rainLayer  = new PIXI.Container();
    app.stage.addChild(this._layerBg);
    app.stage.addChild(this._layerPath);
    app.stage.addChild(this._layerNodes);
    app.stage.addChild(this._layerWalk);
    app.stage.addChild(this._rainLayer);

    this._buildWorld();
    this._scrollToActive();
    this._bindScroll();
    app.ticker.add((dt) => this._tick(dt));
  }

  // ── Node durumlarını güncelle ─────────────────────────────────────
  _refreshNodes() {
    if (!this._nodes.length) return;
    const progress  = getProgress();
    const doneLevel = TEST_MODE ? TOTAL_LEVELS : (progress.completedLevel || 0);
    for (const nd of this._nodes) {
      nd.unlocked = nd.li < doneLevel;
      nd.isActive = nd.li === doneLevel;
      nd.nodeR    = nd.isActive ? 20 : (nd.unlocked ? 16 : 13);
      nd.numLbl.alpha      = (nd.unlocked || nd.isActive) ? 0.90 : 0.25;
      nd.numLbl.style.fill = (nd.unlocked || nd.isActive) ? 0xffffff : 0x333355;
    }
    this._scrollToActive();
  }

  // ── Dünya ─────────────────────────────────────────────────────────
  _buildWorld() {
    const W = this._app.screen.width;
    const H = this._app.screen.height;
    const progress  = getProgress();
    const doneLevel = TEST_MODE ? TOTAL_LEVELS : (progress.completedLevel || 0);

    const STEP    = 90;
    const TOP_PAD = H * 0.15;
    const BOT_PAD = H * 0.15;
    this._worldH  = TOTAL_LEVELS * STEP + TOP_PAD + BOT_PAD;

    // Patika noktaları — alttan üste (li=0 altta, li=49 üstte)
    const pts = [];
    for (let li = 0; li < TOTAL_LEVELS; li++) {
      const worldY = this._worldH - BOT_PAD - li * STEP;
      const phase  = li * 0.72 + 0.3;
      const worldX = W / 2 + Math.sin(phase) * W * 0.28;
      pts.push({ x: worldX, y: worldY });
    }
    this._pathPts = pts;

    // Arka plan dekor topları
    const rngBg = seededRng(777);
    for (let i = 0; i < 60; i++) {
      const ci    = Math.floor(rngBg() * TOTAL_CHECKPOINTS);
      const world = getWorldConfig(ci);
      const col   = hexToInt(world.palette[Math.floor(rngBg() * 7)]);
      const r     = 4 + rngBg() * 10;
      const gfx   = new PIXI.Graphics();
      drawBall(gfx, 0, 0, r, col);
      gfx.x = rngBg() * W; gfx.y = rngBg() * this._worldH;
      gfx.alpha = 0.18 + rngBg() * 0.18;
      this._layerBg.addChild(gfx);
      this._bgParticles.push({ gfx, baseY: gfx.y, phase: rngBg() * Math.PI * 2, speed: 0.008 + rngBg() * 0.012 });
    }

    // Patika çizgisi
    const pathG = new PIXI.Graphics();
    const cpX = (i) => {
      const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[Math.min(pts.length-1,i+1)], p3=pts[Math.min(pts.length-1,i+2)];
      return { cx1:p1.x+(p2.x-p0.x)/6, cy1:p1.y+(p2.y-p0.y)/6, cx2:p2.x-(p3.x-p1.x)/6, cy2:p2.y-(p3.y-p1.y)/6 };
    };
    // Zemin
    pathG.lineStyle(14, 0x0a0a1a, 0.70);
    pathG.moveTo(pts[0].x, pts[0].y);
    for (let i=0; i<pts.length-1; i++) { const c=cpX(i); pathG.bezierCurveTo(c.cx1,c.cy1,c.cx2,c.cy2,pts[i+1].x,pts[i+1].y); }
    // Kilitli gri
    pathG.lineStyle(7, 0x222233, 0.45);
    pathG.moveTo(pts[0].x, pts[0].y);
    for (let i=0; i<pts.length-1; i++) { const c=cpX(i); pathG.bezierCurveTo(c.cx1,c.cy1,c.cx2,c.cy2,pts[i+1].x,pts[i+1].y); }
    pathG.lineStyle(0);
    // Tamamlanan renkli segmentler — her CP kendi paletinden
    for (let li=0; li<doneLevel && li<pts.length-1; li++) {
      const ci    = Math.floor(li / LEVELS_PER_CP);
      const world = getWorldConfig(ci);
      // CP içindeki pozisyon (0-9) → palette index (0-6) orantılı
      const posInCp  = li % LEVELS_PER_CP;
      const palIdx   = Math.floor(posInCp / LEVELS_PER_CP * world.palette.length);
      const col      = hexToInt(world.palette[palIdx]);
      const c=cpX(li);
      pathG.lineStyle(10,col,0.30); pathG.moveTo(pts[li].x,pts[li].y); pathG.bezierCurveTo(c.cx1,c.cy1,c.cx2,c.cy2,pts[li+1].x,pts[li+1].y);
      pathG.lineStyle(7,col,0.85); pathG.moveTo(pts[li].x,pts[li].y); pathG.bezierCurveTo(c.cx1,c.cy1,c.cx2,c.cy2,pts[li+1].x,pts[li+1].y);
      pathG.lineStyle(0);
    }
    // Parlama
    pathG.lineStyle(2.5, 0xffffff, 0.07);
    pathG.moveTo(pts[0].x, pts[0].y);
    for (let i=0; i<pts.length-1; i++) { const c=cpX(i); pathG.bezierCurveTo(c.cx1,c.cy1,c.cx2,c.cy2,pts[i+1].x,pts[i+1].y); }
    pathG.lineStyle(0);
    this._layerPath.addChild(pathG);

    // CP isimleri gösterilmiyor

    // Level node'ları
    this._nodes = [];
    for (let li=0; li<TOTAL_LEVELS; li++) {
      const ci=Math.floor(li/LEVELS_PER_CP), world=getWorldConfig(ci), pt=pts[li];
      const unlocked=li<doneLevel, isActive=li===doneLevel;
      const posInCp  = li % LEVELS_PER_CP;
      const palIdx   = Math.floor(posInCp / LEVELS_PER_CP * world.palette.length);
      const col      = hexToInt(world.palette[palIdx]);
      const nodeR=isActive?20:(unlocked?16:13);

      const gfx=new PIXI.Graphics();
      this._layerNodes.addChild(gfx);

      const numLbl=new PIXI.Text(`${li+1}`,{fontFamily:'"ui-rounded","Arial Rounded MT Bold",sans-serif',fontSize:Math.max(10,nodeR*0.75),fontWeight:'bold',fill:(unlocked||isActive)?0xffffff:0x333355});
      numLbl.anchor.set(0.5,0.5); numLbl.x=pt.x; numLbl.y=pt.y;
      numLbl.alpha=(unlocked||isActive)?0.90:0.25;
      this._layerNodes.addChild(numLbl);

      const hit=new PIXI.Graphics();
      hit.beginFill(0xffffff,0.001); hit.drawCircle(pt.x,pt.y,nodeR+10); hit.endFill();
      hit.interactive=true; hit.cursor=(unlocked||isActive)?'pointer':'default';

      const nd={li,ci,world,unlocked,isActive,x:pt.x,worldY:pt.y,col,nodeR,pulseT:li*0.4,hovered:false,gfx,numLbl};

      hit.on('pointerover', ()=>{ if(nd.unlocked||nd.isActive) nd.hovered=true; });
      hit.on('pointerout',  ()=>{ nd.hovered=false; });
      hit.on('pointertap',  ()=>{
        if(!nd.unlocked && !nd.isActive) return;
        this._onNodeTap(nd.li);
      });
      this._layerNodes.addChild(hit);
      this._nodes.push(nd);
    }

    // Yürüyen hayvanlar
    const rngW=seededRng(999);
    for (let wi=0; wi<6; wi++) {
      const ci=Math.floor(rngW()*TOTAL_CHECKPOINTS), world=getWorldConfig(ci);
      const col=hexToInt(world.palette[Math.floor(rngW()*7)]);
      const R=18+rngW()*14, flipX=rngW()>0.5, startT=rngW(), speed=0.00008+rngW()*0.00012;
      const gfx=new PIXI.Graphics(); gfx.alpha=0.55+rngW()*0.30;
      this._layerWalk.addChild(gfx);
      this._walkers.push({ci,world,col,R,flipX,shape:world.shape,t:startT,speed,gfx,bobT:rngW()*Math.PI*2});
    }

    const initC=hexToRGB(getWorldConfig(0).bgColor);
    this._bgRGB={r:initC.r*.28,g:initC.g*.28,b:initC.b*.28+8};
  }

  // ── Patika pozisyon ───────────────────────────────────────────────
  _pathPos(t) {
    const pts=this._pathPts;
    if(!pts.length) return {x:0,y:0};
    const total=pts.length-1, fi=Math.max(0,Math.min(total-0.001,t*total));
    const i=Math.floor(fi), frac=fi-i;
    const a=pts[i], b=pts[Math.min(i+1,total)];
    return {x:a.x+(b.x-a.x)*frac,y:a.y+(b.y-a.y)*frac};
  }

  // ── Tick ──────────────────────────────────────────────────────────
  _tick(dt) {
    this._time+=dt;
    this._scrollY+=(this._targetY-this._scrollY)*0.10;
    this._layerBg.y=this._layerPath.y=this._layerNodes.y=this._layerWalk.y=-this._scrollY;

    const H=this._app.screen.height, midY=this._scrollY+H/2;
    const STEP=90, BOT_PAD=H*0.15;
    const topLi=Math.round((this._worldH-BOT_PAD-midY)/STEP);
    const ci=Math.max(0,Math.min(TOTAL_CHECKPOINTS-1,Math.floor(topLi/LEVELS_PER_CP)));
    const tgt=hexToRGB(getWorldConfig(ci).bgColor), lr=0.04;
    this._bgRGB.r+=(tgt.r*.28-this._bgRGB.r)*lr;
    this._bgRGB.g+=(tgt.g*.28-this._bgRGB.g)*lr;
    this._bgRGB.b+=(tgt.b*.28+8-this._bgRGB.b)*lr;

    const bc=this._bgCanvas, bx=this._bgCtx;
    if(bc.width!==this._app.screen.width||bc.height!==H){bc.width=this._app.screen.width;bc.height=H;}
    bx.fillStyle=`rgb(${Math.round(this._bgRGB.r)},${Math.round(this._bgRGB.g)},${Math.round(this._bgRGB.b)})`;
    bx.fillRect(0,0,bc.width,H);

    for(const p of this._bgParticles){p.phase+=p.speed*dt;p.gfx.y=p.baseY+Math.sin(p.phase)*8;}
    for(const nd of this._nodes) this._drawNode(nd,dt);
    for(const w of this._walkers){
      w.t=(w.t+w.speed*dt)%1.0; w.bobT+=dt*0.04;
      const pos=this._pathPos(w.t), bob=Math.sin(w.bobT)*3;
      w.gfx.clear(); drawAnimal(w.gfx,w.shape,w.col,0,bob,w.R,w.flipX);
      w.gfx.x=pos.x+(w.flipX?-1:1)*w.R*2.2; w.gfx.y=pos.y;
    }
    if(this._rainOn) this._updateRain();
  }

  // ── Node çizim ────────────────────────────────────────────────────
  _drawNode(nd, dt) {
    nd.pulseT+=dt*0.028;
    const pulse=Math.sin(nd.pulseT)*0.5+0.5, g=nd.gfx;
    g.clear();
    const R=nd.nodeR, sc=nd.hovered?1.22:(nd.isActive?1.06+pulse*0.06:1.0), r=R*sc;
    if(!nd.unlocked&&!nd.isActive){
      g.beginFill(0x1a1a2e,0.88); g.drawCircle(nd.x,nd.worldY,r); g.endFill();
      g.lineStyle(1.5,0x2a2a44,0.60); g.drawCircle(nd.x,nd.worldY,r); g.lineStyle(0);
      const lw=r*.40,lh=r*.32,lx=nd.x-lw/2,ly=nd.worldY-r*.08;
      g.beginFill(0x2a2a44,0.85); g.drawRoundedRect(lx,ly,lw,lh,lw*.22); g.endFill();
      g.lineStyle(r*.10,0x2a2a44,0.85); g.arc(nd.x,ly,lw*.26,Math.PI,0,false); g.lineStyle(0);
      return;
    }
    drawBall(g,nd.x,nd.worldY,r,nd.col);
    if(nd.isActive){
      g.lineStyle(3,nd.col,0.35+0.45*pulse); g.drawCircle(nd.x,nd.worldY,r+5+pulse*8); g.lineStyle(0);
    }
    if(nd.hovered){
      g.lineStyle(2.5,0xffffff,0.35); g.drawCircle(nd.x,nd.worldY,r+4); g.lineStyle(0);
    }
  }

  // ── Scroll ────────────────────────────────────────────────────────
  _scrollToActive() {
    const p=getProgress(), doneLevel=p.completedLevel||0;
    const activeIdx=Math.min(doneLevel,TOTAL_LEVELS-1);
    const nd=this._nodes[activeIdx];
    if(!nd) return;
    const H=this._app.screen.height;
    this._targetY=Math.max(0,Math.min(this._worldH-H,nd.worldY-H*0.5));
    this._scrollY=this._targetY;
  }

  _bindScroll() {
    const el=this._div;
    el.addEventListener('wheel',(e)=>{
      this._targetY=Math.max(0,Math.min(this._worldH-this._app.screen.height,this._targetY+e.deltaY*0.8));
    });
    let ty=0;
    el.addEventListener('touchstart',(e)=>{ty=e.touches[0].clientY;},{passive:true});
    el.addEventListener('touchmove',(e)=>{
      const dy=ty-e.touches[0].clientY; ty=e.touches[0].clientY;
      this._targetY=Math.max(0,Math.min(this._worldH-this._app.screen.height,this._targetY+dy*1.2));
    },{passive:true});
  }

  // ── Yağmur ────────────────────────────────────────────────────────
  _updateRain() {
    const W=this._app.screen.width,H=this._app.screen.height;
    if(Math.random()<0.28){
      const col=hexToInt(this._rainCols[Math.floor(Math.random()*this._rainCols.length)]);
      const r=5+Math.random()*10, gfx=new PIXI.Graphics();
      drawBall(gfx,0,0,r,col); gfx.alpha=0.82;
      gfx.x=Math.random()*W; gfx.y=-r*2;
      this._rain.push({gfx,vy:2+Math.random()*4,vx:(Math.random()-.5)*1.5});
      this._rainLayer.addChild(gfx);
    }
    for(let i=this._rain.length-1;i>=0;i--){
      const p=this._rain[i]; p.gfx.x+=p.vx; p.gfx.y+=p.vy;
      if(p.gfx.y>H+20){this._rainLayer.removeChild(p.gfx);this._rain.splice(i,1);}
    }
  }

  // ── Devam butonu ──────────────────────────────────────────────────
  _showContBtn(onDone) {
    if(this._contBtn) this._contBtn.remove();
    const btn=document.createElement('button');
    btn.textContent='Devam ▶';
    btn.style.cssText=`position:fixed;bottom:48px;left:50%;transform:translateX(-50%);
      z-index:200;padding:16px 48px;background:linear-gradient(135deg,#FFD700,#FF9500);
      color:#000;font-size:18px;font-weight:bold;font-family:"ui-rounded","Arial Rounded MT Bold",sans-serif;letter-spacing:2px;
      border:none;border-radius:50px;cursor:pointer;box-shadow:0 0 32px rgba(255,210,0,0.5);
      opacity:0;transition:opacity 0.4s;`;
    document.body.appendChild(btn);
    this._contBtn=btn;
    requestAnimationFrame(()=>{btn.style.opacity='1';});
    btn.addEventListener('click',()=>{
      this._rainOn=false;
      this._rain.forEach(p=>this._rainLayer.removeChild(p.gfx));
      this._rain=[];
      btn.remove(); this._contBtn=null;
      this.hide(); if(onDone)onDone();
    });
  }
}
