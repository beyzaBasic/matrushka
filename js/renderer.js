// ── renderer.js ───────────────────────────────────────────────────
import { state } from './state.js';
import { TUTORIAL_LEVELS, SHAPE_DEFS } from './constants.js';

export class Renderer {

  // ════════════════════════════════════════════════════════════════
  // TEMEL ARAÇLAR
  // ════════════════════════════════════════════════════════════════

  rrect(x, y, w, h, r) {
    const ctx = state.ctx;
    r = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);   ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h-r); ctx.quadraticCurveTo(x + w, y + h, x + w-r, y + h);
    ctx.lineTo(x + r, y + h);   ctx.quadraticCurveTo(x,     y + h, x,       y + h-r);
    ctx.lineTo(x, y + r);       ctx.quadraticCurveTo(x,     y,     x + r,   y);
    ctx.closePath();
  }

  // ── Renk önbellekleri (hex parse pahalı, her frame tekrarlanmasın) ──
  _shadeCache = new Map();

  shadeColor(hex, amt) {
    const k = hex + amt;
    let v = this._shadeCache.get(k);
    if (v) return v;
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
    v = `rgb(${r},${g},${b})`;
    if (this._shadeCache.size > 512) this._shadeCache.clear();
    this._shadeCache.set(k, v);
    return v;
  }

  _ellipsePath(cx, cy, rx, ry, ax, ay) {
    const ctx = state.ctx;
    const K = 0.5523, tx = -ay, ty = ax;
    ctx.beginPath();
    ctx.moveTo(cx + ax*rx, cy + ay*rx);
    ctx.bezierCurveTo(cx+ax*rx+tx*K*ry, cy+ay*rx+ty*K*ry, cx+tx*ry+ax*K*rx, cy+ty*ry+ay*K*rx, cx+tx*ry, cy+ty*ry);
    ctx.bezierCurveTo(cx+tx*ry-ax*K*rx, cy+ty*ry-ay*K*rx, cx-ax*rx+tx*K*ry, cy-ay*rx+ty*K*ry, cx-ax*rx, cy-ay*rx);
    ctx.bezierCurveTo(cx-ax*rx-tx*K*ry, cy-ay*rx-ty*K*ry, cx-tx*ry-ax*K*rx, cy-ty*ry-ay*K*rx, cx-tx*ry, cy-ty*ry);
    ctx.bezierCurveTo(cx-tx*ry+ax*K*rx, cy-ty*ry+ay*K*rx, cx+ax*rx-tx*K*ry, cy+ay*rx-ty*K*ry, cx+ax*rx, cy+ay*rx);
    ctx.closePath();
  }

  _candyGrad(x, y, r, color, hiAmt = 80, loAmt = -70) {
    const ctx = state.ctx;
    const g = ctx.createRadialGradient(x - r*0.25, y - r*0.35, r*0.01, x, y, r);
    g.addColorStop(0,   this.shadeColor(color, hiAmt));
    g.addColorStop(0.3, color);
    g.addColorStop(1,   this.shadeColor(color, loAmt));
    return g;
  }

  // ════════════════════════════════════════════════════════════════
  // TOP ÇİZİMİ
  // ════════════════════════════════════════════════════════════════

  // ── Shape Cache ─────────────────────────────────────────────────
  // key: "shape|r|color|contains" → OffscreenCanvas
  _shapeCache = new Map();

  _getCacheKey(c) {
    const shape = c.shape || state.LEVELS[c.level]?.shape || 'sphere';
    if (shape === 'sphere') return null; // sphere zaten hızlı
    return `${shape}|${Math.round(c.r)}|${c.color}|${c.contains.join(',')}`;
  }

  _drawCached(c, drawFn) {
    const key = this._getCacheKey(c);
    if (!key) { drawFn(c); return; }

    // Squish/boing varsa cache kullanma — deformasyon anlık
    if ((c.boing > 0.01) || (c.squish && c.squish.t > 0.05)) {
      drawFn(c); return;
    }

    if (!this._shapeCache.has(key)) {
      const DPR  = Math.min(window.devicePixelRatio || 1, 2);
      const pad  = Math.ceil(c.r * 0.25); // gölge için pay — 0.35→0.25 küçüldü
      const size = Math.ceil((c.r * 2 + pad * 2) * DPR);
      const cx0  = size / 2, cy0 = size / 2;
      const oc   = new OffscreenCanvas(size, size);
      const octx = oc.getContext('2d');
      octx.scale(DPR, DPR);           // retina kalitesi
      const logicalSize = size / DPR;
      const fake = { ...c,
        x: logicalSize / 2, y: logicalSize / 2,
        r: c.r,
        boing: 0, squish: null, absorbAnim: 0 };
      const savedCtx = state.ctx;
      state.ctx = octx;
      drawFn(fake);
      state.ctx = savedCtx;
      this._shapeCache.set(key, { oc, logicalSize });
      if (this._shapeCache.size > 200) {
        this._shapeCache.delete(this._shapeCache.keys().next().value);
      }
    }

    const { oc, logicalSize } = this._shapeCache.get(key);
    const ctx = state.ctx;
    ctx.save();
    if (c.absorbAnim > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 28*(c.absorbAnim/35); }
    ctx.drawImage(oc, c.x - logicalSize/2, c.y - logicalSize/2, logicalSize, logicalSize);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Cache'i temizle (tema değişince)
  clearShapeCache() { this._shapeCache.clear(); this._invalidatePaletteGuide(); }

  drawSphere(c) {
    const shape = c.shape || state.LEVELS[c.level]?.shape || 'sphere';
    if (shape === 'bear')      { this._drawCached(c, (fc) => this._drawBear(fc));      this.drawAbsorbHalo(c); return; }
    if (shape === 'matrushka') { this._drawCached(c, (fc) => this._drawMatrushka(fc)); this.drawAbsorbHalo(c); return; }
    if (shape === 'duck')      { this._drawCached(c, (fc) => this._drawDuck(fc));      this.drawAbsorbHalo(c); return; }
    if (shape === 'fish')      { this._drawCached(c, (fc) => this._drawFish(fc));      this.drawAbsorbHalo(c); return; }

    const ctx = state.ctx;
    const { S, gameTime, LEVELS } = state;
    const scale = c.boing > 0 ? 1 + Math.sin(c.boing * Math.PI) * 0.25 : 1;
    const dr    = Math.max(0.1, c.r * scale);

    this.drawAbsorbHalo(c);

    const { rx, ry, ax, ay, hasSquish } = this._squishParams(c, dr);
    const path = () => hasSquish
      ? this._ellipsePath(c.x, c.y, rx, ry, ax, ay)
      : (ctx.beginPath(), ctx.arc(c.x, c.y, dr, 0, Math.PI * 2));

    ctx.save();
    if (c.absorbAnim > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 14; }
    else { ctx.shadowBlur = 0; }

    path(); ctx.fillStyle = this._candyGrad(c.x, c.y, dr, c.color); ctx.fill();
    this._drawInnerRings(c, dr, ax, ay, hasSquish);

    path(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = dr * 0.07; ctx.stroke();
    this._drawSpecular(c, dr, path);
    this._drawBottomGleam(c, dr);

    ctx.restore();
  }



  // ── Soft yüz — sadece sphere topları için, level'a göre 7 ifade ─
  _drawFace(ctx, x, y, r, level) {
    const lv = Math.max(0, Math.min(level, 6));
    ctx.save();
    ctx.lineCap = 'round';

    const cheek = () => {
      ctx.fillStyle = 'rgba(255,150,150,0.30)';
      ctx.beginPath(); ctx.ellipse(x-r*0.38,y+r*0.1,r*0.13,r*0.09,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+r*0.38,y+r*0.1,r*0.13,r*0.09,0,0,Math.PI*2); ctx.fill();
    };
    const solidEye = (ox, oy, er) => {
      ctx.fillStyle='rgba(30,15,5,0.72)';
      ctx.beginPath(); ctx.arc(x+ox,y+oy,er,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(x+ox-er*0.28,y+oy-er*0.35,er*0.36,0,Math.PI*2); ctx.fill();
    };

    if (lv === 0) {
      ctx.strokeStyle='rgba(30,15,5,0.52)'; ctx.lineWidth=r*0.055;
      ctx.beginPath(); ctx.arc(x-r*0.26,y-r*0.05,r*0.13,Math.PI*0.08,Math.PI*0.92); ctx.stroke();
      ctx.beginPath(); ctx.arc(x+r*0.26,y-r*0.05,r*0.13,Math.PI*0.08,Math.PI*0.92); ctx.stroke();
      ctx.beginPath(); ctx.arc(x,y+r*0.2,r*0.12,0.18,Math.PI-0.18); ctx.stroke();
      cheek();
    } else if (lv === 1) {
      solidEye(-r*0.26,-r*0.07,r*0.13); solidEye(+r*0.26,-r*0.07,r*0.13);
      ctx.fillStyle='rgba(30,15,5,0.5)';
      ctx.beginPath(); ctx.ellipse(x,y+r*0.22,r*0.07,r*0.085,0,0,Math.PI*2); ctx.fill();
      cheek();
    } else if (lv === 2) {
      ctx.strokeStyle='rgba(30,15,5,0.58)'; ctx.lineWidth=r*0.065;
      ctx.beginPath(); ctx.arc(x-r*0.26,y-r*0.07,r*0.13,Math.PI+0.22,Math.PI*2-0.22); ctx.stroke();
      ctx.beginPath(); ctx.arc(x+r*0.26,y-r*0.07,r*0.13,Math.PI+0.22,Math.PI*2-0.22); ctx.stroke();
      ctx.beginPath(); ctx.arc(x,y+r*0.1,r*0.2,0.18,Math.PI-0.18); ctx.stroke();
      cheek();
    } else if (lv === 3) {
      ctx.strokeStyle='rgba(30,15,5,0.52)'; ctx.lineWidth=r*0.06;
      ctx.beginPath(); ctx.moveTo(x-r*0.38,y-r*0.07); ctx.lineTo(x-r*0.14,y-r*0.07); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+r*0.14,y-r*0.07); ctx.lineTo(x+r*0.38,y-r*0.07); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x-r*0.14,y+r*0.22); ctx.lineTo(x+r*0.14,y+r*0.22); ctx.stroke();
    } else if (lv === 4) {
      solidEye(-r*0.26,-r*0.08,r*0.14); solidEye(+r*0.26,-r*0.08,r*0.14);
      ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=r*0.038;
      for (let i=0; i<4; i++) {
        const a=i/4*Math.PI*2, sr=r*0.09;
        ctx.beginPath(); ctx.moveTo(x-r*0.26+Math.cos(a)*sr*0.28,y-r*0.08+Math.sin(a)*sr*0.28);
        ctx.lineTo(x-r*0.26+Math.cos(a)*sr,y-r*0.08+Math.sin(a)*sr); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+r*0.26+Math.cos(a)*sr*0.28,y-r*0.08+Math.sin(a)*sr*0.28);
        ctx.lineTo(x+r*0.26+Math.cos(a)*sr,y-r*0.08+Math.sin(a)*sr); ctx.stroke();
      }
      ctx.fillStyle='rgba(30,15,5,0.48)';
      ctx.beginPath(); ctx.ellipse(x,y+r*0.22,r*0.07,r*0.09,0,0,Math.PI*2); ctx.fill();
      cheek();
    } else if (lv === 5) {
      solidEye(-r*0.26,-r*0.06,r*0.12); solidEye(+r*0.26,-r*0.06,r*0.12);
      ctx.fillStyle='rgba(30,15,5,0.18)';
      ctx.beginPath(); ctx.ellipse(x-r*0.26,y-r*0.12,r*0.12,r*0.07,0,0,Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+r*0.26,y-r*0.12,r*0.12,r*0.07,0,0,Math.PI); ctx.fill();
      ctx.strokeStyle='rgba(30,15,5,0.48)'; ctx.lineWidth=r*0.06;
      ctx.beginPath(); ctx.arc(x,y+r*0.35,r*0.13,Math.PI+0.28,Math.PI*2-0.28); ctx.stroke();
      ctx.fillStyle='rgba(120,190,255,0.55)';
      ctx.beginPath(); ctx.ellipse(x-r*0.26,y+r*0.09,r*0.03,r*0.05,0,0,Math.PI*2); ctx.fill();
    } else {
      solidEye(-r*0.26,-r*0.07,r*0.13); solidEye(+r*0.26,-r*0.07,r*0.13);
      ctx.fillStyle='rgba(30,15,5,0.2)';
      ctx.beginPath(); ctx.ellipse(x-r*0.26,y-r*0.13,r*0.13,r*0.075,0,0,Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+r*0.26,y-r*0.13,r*0.13,r*0.075,0,0,Math.PI); ctx.fill();
      ctx.strokeStyle='rgba(30,15,5,0.52)'; ctx.lineWidth=r*0.065;
      ctx.beginPath(); ctx.arc(x,y+r*0.14,r*0.18,0.25,Math.PI-0.25); ctx.stroke();
      cheek();
    }
    ctx.restore();
  }

  // ── Matrushka çizimi ──────────────────────────────────────────────
  _drawMatrushka(c) {
    const ctx = state.ctx;
    const { LEVELS } = state;
    const scale = c.boing > 0 ? 1 + Math.sin(c.boing * Math.PI) * 0.22 : 1;
    const R = Math.max(0.1, c.r * scale); // toplam yarıçap
    const x = c.x, y = c.y;
    const col = c.color;

    ctx.save();

    // Squish dönüşümü
    if (c.squish && c.squish.t > 0) {
      const s = Math.sin(c.squish.t * Math.PI) * c.squish.amt;
      ctx.translate(x, y);
      ctx.scale(1 - s * 0.25, 1 + s * 0.25);
      ctx.translate(-x, -y);
    }

    // Glow
    if (c.absorbAnim > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 28 * (c.absorbAnim / 35); }
    // shadowBlur yok — cache'de gereksiz

    // ── Ölçüler ───────────────────────────────────────────────────
    const _md   = SHAPE_DEFS.matrushka;
    const bodyW  = R * _md.body.rw;
    const bodyH  = R * _md.body.rh;
    const bodyY  = y + R * _md.body.oy;
    const headR  = R * _md.head.r;
    const headY  = y + R * _md.head.oy;

    // ── Yardımcı: radyal gradient ─────────────────────────────────
    const radGrad = (cx2, cy2, rw, rh, c1, c2, c3) => {
      const g = ctx.createRadialGradient(cx2 - rw*0.3, cy2 - rh*0.35, rh*0.05, cx2, cy2, Math.max(rw,rh));
      g.addColorStop(0,   c1);
      g.addColorStop(0.5, c2);
      g.addColorStop(1,   c3);
      return g;
    };

    // ── Gövde ─────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(x, bodyY, bodyW, bodyH, 0, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(x, bodyY, bodyW, bodyH,
      this._lighten(col, 70), col, this._darken(col, 70));
    ctx.fill();

    // ── İçteki halka topları (contains) ──────────────────────────
    ctx.shadowBlur = 0;
    for (let k = 0; k < c.contains.length; k++) {
      const lvIdx = c.contains[k];
      if (lvIdx >= LEVELS.length) continue;
      const lc    = LEVELS[lvIdx].color;
      const ratio = 1 - (k + 1) * (0.62 / (c.contains.length + 1));
      const lw    = Math.max(0.1, bodyW * Math.max(ratio, 0.2));
      const lh    = Math.max(0.1, bodyH * Math.max(ratio, 0.2));
      ctx.beginPath();
      ctx.ellipse(x, bodyY, lw, lh, 0, 0, Math.PI * 2);
      ctx.fillStyle = radGrad(x, bodyY, lw, lh,
        this._lighten(lc, 65), lc, this._darken(lc, 65));
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.2; ctx.stroke();
    }

    // ── Eşarp (kafa-gövde birleşim bandı) ────────────────────────
    // Eşarp rengi: beyazımsı veya col'un açık tonu
    const scarfY1 = headY + headR * 0.55;
    const scarfY2 = scarfY1 + R * 0.13;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(x, scarfY1, bodyW * 0.78, R * 0.10, 0, 0, Math.PI * 2);
    ctx.fillStyle = this._lighten(col, 50);
    ctx.fill();
    // Eşarp deseni — ince çizgiler
    ctx.strokeStyle = this._darken(col, 20);
    ctx.lineWidth = R * 0.025;
    for (let d = -2; d <= 2; d++) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(x + d * bodyW * 0.25, scarfY1 - R * 0.08);
      ctx.lineTo(x + d * bodyW * 0.25, scarfY1 + R * 0.08);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Önlük (gövde ön yüzü) ─────────────────────────────────────
    // Oval açık renk panel
    ctx.beginPath();
    ctx.ellipse(x, bodyY + bodyH*0.05, bodyW * 0.44, bodyH * 0.52, 0, 0, Math.PI * 2);
    ctx.fillStyle = this._lighten(col, 38);
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Kafa ──────────────────────────────────────────────────────
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = radGrad(x, headY, headR, headR,
      this._lighten(col, 70), col, this._darken(col, 70));
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Yüz ───────────────────────────────────────────────────────
    const eyeR = headR * 0.12;
    // Gözler
    ctx.fillStyle = 'rgba(20,10,5,0.85)';
    ctx.beginPath(); ctx.arc(x - headR*0.27, headY - headR*0.05, eyeR, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + headR*0.27, headY - headR*0.05, eyeR, 0, Math.PI*2); ctx.fill();
    // Parıltı
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(x - headR*0.22, headY - headR*0.10, eyeR*0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + headR*0.32, headY - headR*0.10, eyeR*0.4, 0, Math.PI*2); ctx.fill();
    // Yanaklar
    ctx.fillStyle = 'rgba(255,120,100,0.30)';
    ctx.beginPath(); ctx.ellipse(x - headR*0.44, headY + headR*0.14, headR*0.20, headR*0.13, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + headR*0.44, headY + headR*0.14, headR*0.20, headR*0.13, 0, 0, Math.PI*2); ctx.fill();
    // Gülümseme
    ctx.strokeStyle = 'rgba(20,10,5,0.55)';
    ctx.lineWidth = headR * 0.07; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, headY + headR*0.12, headR*0.20, 0.25, Math.PI - 0.25);
    ctx.stroke();

    // ── Saç/başlık bandı ──────────────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(x, headY - headR*0.42, headR*0.82, headR*0.28, 0, Math.PI, Math.PI*2);
    ctx.fillStyle = this._darken(col, 25);
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── Specular ──────────────────────────────────────────────────
    const spg = ctx.createRadialGradient(x - bodyW*0.26, bodyY - bodyH*0.30, 0,
                                          x - bodyW*0.26, bodyY - bodyH*0.30, bodyW*0.40);
    spg.addColorStop(0, 'rgba(255,255,255,0.65)');
    spg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.ellipse(x - bodyW*0.26, bodyY - bodyH*0.30, bodyW*0.30, bodyH*0.22, 0, 0, Math.PI*2);
    ctx.fillStyle = spg; ctx.fill();

    ctx.restore();
  }

  // ── Donald Duck çizimi ───────────────────────────────────────────
  _drawDuck(c) {
    const ctx = state.ctx;
    const { LEVELS } = state;
    const scale = c.boing > 0 ? 1 + Math.sin(c.boing * Math.PI) * 0.22 : 1;
    const r = Math.max(0.1, c.r * scale);
    const x = c.x, y = c.y, col = c.color;
    ctx.save();
    if (c.squish && c.squish.t > 0) {
      const s = Math.sin(c.squish.t * Math.PI) * c.squish.amt;
      ctx.translate(x,y); ctx.scale(1-s*0.25,1+s*0.25); ctx.translate(-x,-y);
    }
    if (c.absorbAnim > 0) { ctx.shadowColor='#fff'; ctx.shadowBlur=28*(c.absorbAnim/35); }
    const grad = (cx2,cy2,rr) => {
      const g=ctx.createRadialGradient(cx2-rr*0.3,cy2-rr*0.35,rr*0.05,cx2,cy2,rr);
      g.addColorStop(0,this._lighten(col,70)); g.addColorStop(0.5,col); g.addColorStop(1,this._darken(col,60));
      return g;
    };
    // Gövde — kanat çizgisi YOK
    const _dd = SHAPE_DEFS.duck;
    ctx.beginPath(); ctx.ellipse(x,y+r*_dd.body.oy,r*_dd.body.rw,r*_dd.body.rh,0,0,Math.PI*2);
    ctx.fillStyle=grad(x,y,r*_dd.body.rw); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x-r*0.12,y-r*0.08,r*0.4,r*0.3,-0.3,0,Math.PI*2);
    ctx.fillStyle=this._lighten(col,45); ctx.globalAlpha=0.6; ctx.fill(); ctx.globalAlpha=1;
    // İçteki halka topları
    ctx.shadowBlur=0;
    const bW=r*_dd.body.rw, bH=r*_dd.body.rh, by2=y+r*_dd.body.oy;
    for (let k=0; k<c.contains.length; k++) {
      const lvIdx=c.contains[k]; if (lvIdx>=LEVELS.length) continue;
      const lc=LEVELS[lvIdx].color;
      const ratio=1-(k+1)*(0.62/(c.contains.length+1));
      const lw=Math.max(0.1,bW*Math.max(ratio,0.2)), lh=Math.max(0.1,bH*Math.max(ratio,0.2));
      const ig=ctx.createRadialGradient(x-lw*0.3,by2-lh*0.3,lh*0.05,x,by2,Math.max(lw,lh));
      ig.addColorStop(0,this._lighten(lc,65)); ig.addColorStop(0.5,lc); ig.addColorStop(1,this._darken(lc,65));
      ctx.beginPath(); ctx.ellipse(x,by2,lw,lh,0,0,Math.PI*2); ctx.fillStyle=ig; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.2; ctx.stroke();
    }
    // Baş
    const hx=x+r*_dd.head.ox, hy=y+r*_dd.head.oy, hr=r*_dd.head.r;
    ctx.beginPath(); ctx.arc(hx,hy,hr,0,Math.PI*2); ctx.fillStyle=grad(hx,hy,hr); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx-hr*0.3,hy-hr*0.35,hr*0.38,hr*0.28,-0.3,0,Math.PI*2);
    ctx.fillStyle=this._lighten(col,50); ctx.globalAlpha=0.5; ctx.fill(); ctx.globalAlpha=1;
    // Tüy
    ctx.beginPath(); ctx.moveTo(hx-r*0.04,hy-hr*0.95);
    ctx.bezierCurveTo(hx-r*0.14,hy-hr*1.55,hx+r*0.12,hy-hr*1.6,hx+r*0.08,hy-hr*0.95);
    ctx.fillStyle=this._darken(col,20); ctx.fill();
    // Göz
    ctx.shadowBlur=0;
    const er=hr*0.13;
    ctx.beginPath(); ctx.arc(hx+hr*0.28,hy-hr*0.12,er,0,Math.PI*2); ctx.fillStyle='rgba(10,5,0,0.88)'; ctx.fill();
    ctx.beginPath(); ctx.arc(hx+hr*0.23,hy-hr*0.18,er*0.38,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill();
    // Donald gagası — büyütülmüş
    ctx.beginPath();
    ctx.moveTo(hx+hr*0.75,hy-hr*0.06);
    ctx.bezierCurveTo(hx+hr*1.10,hy+hr*0.04,hx+hr*1.90,hy-hr*0.02,hx+hr*2.10,hy-hr*0.20);
    ctx.bezierCurveTo(hx+hr*2.18,hy-hr*0.36,hx+hr*1.95,hy-hr*0.52,hx+hr*0.75,hy-hr*0.44);
    ctx.closePath(); ctx.fillStyle='#e65100'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx+hr*0.75,hy-hr*0.46);
    ctx.bezierCurveTo(hx+hr*1.10,hy-hr*0.54,hx+hr*1.88,hy-hr*0.58,hx+hr*2.08,hy-hr*0.46);
    ctx.bezierCurveTo(hx+hr*2.18,hy-hr*0.36,hx+hr*1.95,hy-hr*0.20,hx+hr*0.75,hy-hr*0.26);
    ctx.closePath(); ctx.fillStyle='#ff8f00'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx+hr*0.75,hy-hr*0.35);
    ctx.bezierCurveTo(hx+hr*1.15,hy-hr*0.34,hx+hr*1.72,hy-hr*0.34,hx+hr*2.05,hy-hr*0.36);
    ctx.strokeStyle='#bf360c'; ctx.lineWidth=r*0.055; ctx.lineCap='round'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx+hr*1.55,hy-hr*0.52,hr*0.26,hr*0.09,0,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.28)'; ctx.fill();
    // Ayaklar
    ctx.fillStyle='#ff8c00';
    ctx.beginPath(); ctx.ellipse(x-r*0.18,y+r*1.0,r*0.28,r*0.1,-0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x-r*0.18,y+r*0.78); ctx.lineTo(x-r*0.2,y+r*1.0);
    ctx.strokeStyle='#e65100'; ctx.lineWidth=r*0.09; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x+r*0.18,y+r*1.0,r*0.28,r*0.1,0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x+r*0.18,y+r*0.78); ctx.lineTo(x+r*0.2,y+r*1.0);
    ctx.strokeStyle='#e65100'; ctx.lineWidth=r*0.09; ctx.stroke();
    // Specular
    const spg=ctx.createRadialGradient(x-r*0.3,y-r*0.28,0,x-r*0.3,y-r*0.28,r*0.38);
    spg.addColorStop(0,'rgba(255,255,255,0.6)'); spg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.ellipse(x-r*0.3,y-r*0.28,r*0.28,r*0.2,0,0,Math.PI*2); ctx.fillStyle=spg; ctx.fill();
    ctx.restore();
  }

  // ── Tombul Balık çizimi ───────────────────────────────────────────
  _drawFish(c) {
    const ctx = state.ctx;
    const { LEVELS } = state;
    const scale = c.boing > 0 ? 1 + Math.sin(c.boing * Math.PI) * 0.22 : 1;
    const r = Math.max(0.1, c.r * scale);
    const x = c.x, y = c.y, col = c.color;
    ctx.save();
    if (c.squish && c.squish.t > 0) {
      const s = Math.sin(c.squish.t * Math.PI) * c.squish.amt;
      ctx.translate(x,y); ctx.scale(1-s*0.25,1+s*0.25); ctx.translate(-x,-y);
    }
    if (c.absorbAnim > 0) { ctx.shadowColor='#fff'; ctx.shadowBlur=28*(c.absorbAnim/35); }
    // Kuyruk
    ctx.beginPath();
    ctx.moveTo(x-r*0.62,y);
    ctx.bezierCurveTo(x-r*1.05,y-r*0.6,x-r*1.42,y-r*0.42,x-r*1.32,y);
    ctx.bezierCurveTo(x-r*1.42,y+r*0.42,x-r*1.05,y+r*0.6,x-r*0.62,y);
    ctx.fillStyle=this._darken(col,22); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x-r*0.65,y);
    ctx.bezierCurveTo(x-r*0.98,y-r*0.2,x-r*1.18,y-r*0.1,x-r*1.1,y);
    ctx.bezierCurveTo(x-r*1.18,y+r*0.1,x-r*0.98,y+r*0.2,x-r*0.65,y);
    ctx.fillStyle=this._lighten(col,30); ctx.fill();
    // Tombul gövde
    const _fd = SHAPE_DEFS.fish;
    ctx.beginPath(); ctx.ellipse(x+r*_fd.body.ox,y,r*_fd.body.rw,r*_fd.body.rh,0,0,Math.PI*2);
    const g=ctx.createRadialGradient(x-r*0.18,y-r*0.28,r*0.05,x+r*0.05,y,r*0.9);
    g.addColorStop(0,this._lighten(col,72)); g.addColorStop(0.45,col); g.addColorStop(1,this._darken(col,55));
    ctx.fillStyle=g; ctx.fill();
    // İçteki halka topları
    ctx.shadowBlur=0;
    const bW=r*_fd.body.rw, bH=r*_fd.body.rh;
    for (let k=0; k<c.contains.length; k++) {
      const lvIdx=c.contains[k]; if (lvIdx>=LEVELS.length) continue;
      const lc=LEVELS[lvIdx].color;
      const ratio=1-(k+1)*(0.62/(c.contains.length+1));
      const lw=Math.max(0.1,bW*Math.max(ratio,0.2)), lh=Math.max(0.1,bH*Math.max(ratio,0.2));
      const ig=ctx.createRadialGradient(x-lw*0.3,y-lh*0.3,lh*0.05,x,y,Math.max(lw,lh));
      ig.addColorStop(0,this._lighten(lc,65)); ig.addColorStop(0.5,lc); ig.addColorStop(1,this._darken(lc,65));
      ctx.beginPath(); ctx.ellipse(x,y,lw,lh,0,0,Math.PI*2); ctx.fillStyle=ig; ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.2; ctx.stroke();
    }
    // Üst yüzgeç
    ctx.beginPath();
    ctx.moveTo(x+r*0.08,y-r*0.72);
    ctx.bezierCurveTo(x+r*0.32,y-r*1.14,x+r*0.62,y-r*1.02,x+r*0.54,y-r*0.72);
    ctx.fillStyle=this._darken(col,18); ctx.fill();
    // Yan yüzgeç
    ctx.beginPath();
    ctx.moveTo(x+r*0.12,y+r*0.48);
    ctx.bezierCurveTo(x-r*0.02,y+r*0.85,x-r*0.3,y+r*0.78,x-r*0.2,y+r*0.48);
    ctx.fillStyle=this._darken(col,25); ctx.fill();
    // Büyük gaga
    const mx=x+r*0.88, my=y+r*0.05;
    ctx.beginPath();
    ctx.moveTo(mx,my-r*0.04);
    ctx.bezierCurveTo(mx+r*0.18,my+r*0.02,mx+r*0.32,my+r*0.18,mx+r*0.22,my+r*0.3);
    ctx.bezierCurveTo(mx+r*0.08,my+r*0.38,mx-r*0.12,my+r*0.3,mx-r*0.1,my+r*0.12);
    ctx.closePath(); ctx.fillStyle=this._darken(col,35); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(mx-r*0.1,my+r*0.12);
    ctx.bezierCurveTo(mx-r*0.12,my-r*0.04,mx+r*0.04,my-r*0.18,mx+r*0.22,my-r*0.12);
    ctx.bezierCurveTo(mx+r*0.34,my-r*0.06,mx+r*0.32,my+r*0.1,mx+r*0.22,my+r*0.18);
    ctx.bezierCurveTo(mx+r*0.1,my+r*0.06,mx+r*0.02,my+r*0.0,mx-r*0.1,my+r*0.12);
    ctx.closePath(); ctx.fillStyle=this._darken(col,20); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx+r*0.1,my+r*0.1,r*0.12,r*0.09,0.2,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx+r*0.08,my-r*0.08,r*0.1,r*0.05,-0.3,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fill();
    // Göz
    const ex=x+r*0.48, ey=y-r*0.22;
    ctx.beginPath(); ctx.arc(ex,ey,r*0.22,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.94)'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex+r*0.04,ey+r*0.02,r*0.14,0,Math.PI*2); ctx.fillStyle=this._darken(col,55); ctx.fill();
    ctx.beginPath(); ctx.arc(ex+r*0.05,ey+r*0.03,r*0.075,0,Math.PI*2); ctx.fillStyle='#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex-r*0.01,ey-r*0.06,r*0.042,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex,ey,r*0.22,0,Math.PI*2);
    ctx.strokeStyle=this._darken(col,30); ctx.lineWidth=r*0.045; ctx.stroke();
    // Yanak
    ctx.beginPath(); ctx.ellipse(x+r*0.7,y+r*0.12,r*0.15,r*0.1,0.3,0,Math.PI*2);
    ctx.fillStyle='rgba(255,140,140,0.38)'; ctx.fill();
    // Specular
    const sp=ctx.createRadialGradient(x-r*0.05,y-r*0.32,0,x-r*0.05,y-r*0.32,r*0.42);
    sp.addColorStop(0,'rgba(255,255,255,0.68)'); sp.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.ellipse(x-r*0.05,y-r*0.32,r*0.32,r*0.22,0,0,Math.PI*2); ctx.fillStyle=sp; ctx.fill();
    ctx.restore();
  }

  // ── Gummy Bear çizimi ─────────────────────────────────────────────
  _drawBear(c) {
    const ctx = state.ctx;
    const { S, gameTime, LEVELS } = state;
    const scale = c.boing > 0 ? 1 + Math.sin(c.boing * Math.PI) * 0.25 : 1;
    const r = Math.max(0.1, c.r * scale);
    const x = c.x, y = c.y;
    const col = c.color;

    ctx.save();

    // Squish
    if (c.squish && c.squish.t > 0) {
      const s = Math.sin(c.squish.t * Math.PI) * c.squish.amt;
      ctx.translate(x, y);
      ctx.scale(1 - s * 0.3, 1 + s * 0.3);
      ctx.translate(-x, -y);
    }

    // Glow / absorb anim
    if (c.absorbAnim > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; }

    const grad = (cx2, cy2, r2) => {
      const g = ctx.createRadialGradient(cx2 - r2*0.3, cy2 - r2*0.35, r2*0.05, cx2, cy2, r2);
      g.addColorStop(0, this._lighten(col, 70));
      g.addColorStop(0.5, col);
      g.addColorStop(1, this._darken(col, 60));
      return g;
    };

    const drawPart = (px, py, pr) => {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = grad(px, py, pr);
      ctx.fill();
      // iç halka (contains)
    };

    // ── Gövde ─────────────────────────────────────────────────────
    const _bd = SHAPE_DEFS.bear;
    const bx = x, by = y + r * _bd.body.oy;
    const br = r * _bd.body.r;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = grad(bx, by - br*0.2, br);
    ctx.fill();

    // ── Kafa ──────────────────────────────────────────────────────
    const hx = x, hy = y + r * _bd.head.oy;
    const hr = r * _bd.head.r;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fillStyle = grad(hx, hy - hr*0.2, hr);
    ctx.fill();

    // ── Kulaklar ──────────────────────────────────────────────────
    const er = r * _bd.earL.r;
    drawPart(x + r * _bd.earL.ox, y + r * _bd.earL.oy, er);
    drawPart(x + r * _bd.earR.ox, y + r * _bd.earR.oy, er);

    // ── Eller ─────────────────────────────────────────────────────
    const ar = r * _bd.armL.r;
    drawPart(x + r * _bd.armL.ox, y + r * _bd.armL.oy, ar);
    drawPart(x + r * _bd.armR.ox, y + r * _bd.armR.oy, ar);

    // ── Ayaklar ───────────────────────────────────────────────────
    const fr = r * _bd.footL.r;
    drawPart(x + r * _bd.footL.ox, y + r * _bd.footL.oy, fr);
    drawPart(x + r * _bd.footR.ox, y + r * _bd.footR.oy, fr);

    // ── İçteki halka topları (contains) ──────────────────────────
    for (let k = 0; k < c.contains.length; k++) {
      const lvIdx = c.contains[k];
      if (lvIdx >= LEVELS.length) continue;
      const lColor = LEVELS[lvIdx].color;
      const ratio = 1 - (k + 1) * (0.7 / (c.contains.length + 1));
      const lr = Math.max(0.1, br * Math.max(ratio, 0.15));
      ctx.beginPath();
      ctx.arc(bx, by, lr, 0, Math.PI * 2);
      const ig = ctx.createRadialGradient(bx - lr*0.3, by - lr*0.3, lr*0.05, bx, by, lr);
      ig.addColorStop(0, this._lighten(lColor, 70));
      ig.addColorStop(0.5, lColor);
      ig.addColorStop(1, this._darken(lColor, 60));
      ctx.fillStyle = ig;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // ── Gözler ────────────────────────────────────────────────────
    ctx.shadowBlur = 0;
    const ehr = r * 0.072;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath(); ctx.arc(hx - hr*0.32, hy - hr*0.05, ehr, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + hr*0.32, hy - hr*0.05, ehr, 0, Math.PI*2); ctx.fill();
    // Göz parıltısı
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(hx - hr*0.28, hy - hr*0.10, ehr*0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + hr*0.36, hy - hr*0.10, ehr*0.4, 0, Math.PI*2); ctx.fill();

    // ── Burun ─────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath(); ctx.ellipse(hx, hy + hr*0.15, ehr*0.7, ehr*0.45, 0, 0, Math.PI*2); ctx.fill();

    // ── Specular ──────────────────────────────────────────────────
    const sg = ctx.createRadialGradient(hx - hr*0.25, hy - hr*0.28, 0, hx - hr*0.25, hy - hr*0.28, hr*0.4);
    sg.addColorStop(0, 'rgba(255,255,255,0.75)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(hx - hr*0.25, hy - hr*0.28, hr*0.28, 0, Math.PI*2);
    ctx.fillStyle = sg; ctx.fill();

    ctx.restore();
  }

  _lightenCache = new Map();
  _darkenCache  = new Map();

  _lighten(hex, amt) {
    const k = hex + amt;
    let v = this._lightenCache.get(k);
    if (v) return v;
    const n = parseInt(hex.replace('#',''), 16);
    v = `rgb(${Math.min(255,(n>>16)+amt)},${Math.min(255,((n>>8)&0xff)+amt)},${Math.min(255,(n&0xff)+amt)})`;
    if (this._lightenCache.size > 512) this._lightenCache.clear();
    this._lightenCache.set(k, v);
    return v;
  }

  _darken(hex, amt) {
    const k = hex + amt;
    let v = this._darkenCache.get(k);
    if (v) return v;
    const n = parseInt(hex.replace('#',''), 16);
    v = `rgb(${Math.max(0,(n>>16)-amt)},${Math.max(0,((n>>8)&0xff)-amt)},${Math.max(0,(n&0xff)-amt)})`;
    if (this._darkenCache.size > 512) this._darkenCache.clear();
    this._darkenCache.set(k, v);
    return v;
  }

  drawAbsorbHalo(c) {
    const glow = c.absorbGlow || 0;
    if (glow <= 0.15) return;
    const { ctx, S, LEVELS } = state;
    const bigColor = LEVELS[c.level + 1] ? LEVELS[c.level + 1].color : '#fff';
    const haloR    = c.r + 6*S + glow*5*S;
    const speed    = (Date.now() * 0.0002);
    const dashLen  = Math.PI * 0.28;
    const gapLen   = Math.PI * 0.22;
    const segs     = 4;
    const total    = dashLen + gapLen;

    ctx.save();
    ctx.lineWidth   = (2.5 + glow*2) * S;
    ctx.lineCap     = 'round';
    ctx.strokeStyle = bigColor;
    ctx.globalAlpha = 0.55 + glow*0.40;

    for (let s = 0; s < segs; s++) {
      const start = speed + s * total;
      ctx.beginPath();
      ctx.arc(c.x, c.y, haloR, start, start + dashLen);
      ctx.stroke();
    }
    ctx.restore();
  }

  _squishParams(c, dr) {
    const sq = c.squish, hasSquish = !!(sq && sq.t > 0);
    let rx = dr, ry = dr, ax = 0, ay = 1;
    if (hasSquish) {
      const s = Math.sin(sq.t * Math.PI) * sq.amt;
      ax = sq.ax; ay = sq.ay;
      rx = dr * (1 - s * 0.35);
      ry = Math.min(dr / (1 - s * 0.35), dr * 1.25);
    }
    return { rx, ry, ax, ay, hasSquish };
  }

  _drawInnerRings(c, dr, ax, ay, hasSquish) {
    const ctx = state.ctx, { LEVELS } = state, sq = c.squish;
    for (let k = 0; k < c.contains.length; k++) {
      const lvIdx = c.contains[k];
      if (lvIdx >= LEVELS.length) continue;
      const lColor = LEVELS[lvIdx].color;
      const ratio  = 1 - (k + 1) * (0.7 / (c.contains.length + 1));
      const lr     = Math.max(0.1, dr * Math.max(ratio, 0.15));
      let lrx = lr, lry = lr;
      if (hasSquish) {
        const s2 = Math.sin(sq.t * Math.PI) * sq.amt * 0.6;
        lrx = lr * (1 - s2 * 0.35);
        lry = Math.min(lr / Math.max(1 - s2 * 0.35, 0.6), lr * 1.25);
      }
      if (hasSquish) this._ellipsePath(c.x, c.y, lrx, lry, ax, ay);
      else { ctx.beginPath(); ctx.arc(c.x, c.y, lr, 0, Math.PI * 2); }
      ctx.fillStyle   = this._candyGrad(c.x, c.y, lr, lColor, 80, -60);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  _drawSpecular(c, dr, path) {
    const ctx = state.ctx;
    const hx  = c.x - dr*0.28, hy = c.y - dr*0.30;
    const hg  = ctx.createRadialGradient(hx, hy, 0, hx, hy, dr*0.42);
    hg.addColorStop(0,   'rgba(255,255,255,0.90)');
    hg.addColorStop(0.4, 'rgba(255,255,255,0.30)');
    hg.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.save(); path(); ctx.clip();
    ctx.beginPath(); ctx.arc(hx, hy, dr*0.28, 0, Math.PI*2);
    ctx.fillStyle = hg; ctx.fill(); ctx.restore();
  }

  _drawBottomGleam(c, dr) {
    const ctx = state.ctx;
    const h2x = c.x + dr*0.20, h2y = c.y + dr*0.38;
    const hg2 = ctx.createRadialGradient(h2x, h2y, 0, h2x, h2y, dr*0.25);
    hg2.addColorStop(0, 'rgba(255,255,255,0.35)'); hg2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(h2x, h2y, dr*0.14, 0, Math.PI*2);
    ctx.fillStyle = hg2; ctx.fill();
  }

  // ════════════════════════════════════════════════════════════════
  // HEDEF SLOTLARI
  // ════════════════════════════════════════════════════════════════

  drawGoalMatrushka(x, y, r, level, contains, alpha, done) {
    const ctx = state.ctx, { LEVELS } = state;
    const shape = LEVELS[level]?.shape || 'sphere';
    const fakeC = { x, y, r, level, color: LEVELS[level]?.color || '#fff', contains,
      boing: 0, absorbAnim: done ? 20 : 0, squish: null, absorbGlow: 0,
      isBeingDragged: false, shape };
    ctx.save(); ctx.globalAlpha = alpha; this.drawSphere(fakeC);
    if (done) {
      ctx.globalAlpha  = alpha;
      ctx.font         = `bold ${Math.round(r * 0.85)}px "ui-rounded",sans-serif`;
      ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,.95)';
      ctx.shadowColor  = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4;
      ctx.fillText('\u2713', x, y + r * 0.05);
    }
    ctx.restore();
  }

  drawGoals(goalManager) {
    this._drawLevelTitle(goalManager);
    this._drawGoalSlots(goalManager);
    this._drawFlyingGoals();
  }

  _drawLevelTitle(goalManager) {
    const ctx = state.ctx, { circles, S, LEVELS, CX } = state;
    const def = goalManager.getLevelDef();
    let aTop  = 0;
    for (const cc of circles) {
      if (cc.level > aTop) aTop = cc.level;
      for (const lv of cc.contains) if (lv > aTop) aTop = lv;
    }
    const titleColor = circles.length > 0
      ? LEVELS[aTop].color
      : (LEVELS[def.goals.reduce((mx, g) => Math.max(mx, g.level), 0)]?.color || LEVELS[0].color);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font      = `bold ${Math.round(28 * S)}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.fillStyle = titleColor; ctx.shadowColor = titleColor; ctx.shadowBlur = 10;
    ctx.fillText(goalManager.displayLevelText(), CX, 22);
    ctx.restore();
  }

  _drawGoalSlots(goalManager) {
    const ctx = state.ctx, { goalSlots, LEVELS } = state;
    const def = goalManager.getLevelDef(), t = Date.now() * 0.001;
    for (let i = 0; i < def.goals.length; i++) {
      const sp     = goalManager.goalSlotPos(i), goal = def.goals[i];
      const done   = goalSlots[i] === 'done', flying = goalSlots[i] === 'flying';
      const acc    = LEVELS[goal.level]?.color || '#fff';
      const pulse  = 0.85 + 0.15 * Math.sin(t * 2 + i * 1.1);
      ctx.save();
      done ? this._drawSlotDone(sp, acc, pulse) : this._drawSlotEmpty(sp, acc, t, i);
      ctx.restore();
      if (!flying) this.drawGoalMatrushka(sp.cx, sp.cy, sp.ballR, goal.level, goal.contains, done ? 1 : 0.85, done);
    }
  }

  _drawSlotDone(sp, acc, pulse) {
    const ctx = state.ctx;
    const grd = ctx.createRadialGradient(sp.cx - sp.gemR*0.25, sp.cy - sp.gemR*0.3, 1, sp.cx, sp.cy, sp.gemR);
    grd.addColorStop(0, this.shadeColor(acc, 70)); grd.addColorStop(0.4, acc); grd.addColorStop(1, this.shadeColor(acc, -50));
    ctx.beginPath(); ctx.arc(sp.cx, sp.cy, sp.gemR, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.shadowColor = acc; ctx.shadowBlur = 18 * pulse; ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.3 * pulse})`; ctx.lineWidth = 2; ctx.shadowBlur = 0; ctx.stroke();
  }

  _drawSlotEmpty(sp, acc, t, i) {
    const ctx = state.ctx;
    ctx.beginPath(); ctx.arc(sp.cx, sp.cy, sp.gemR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    ctx.strokeStyle = acc; ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.45 + 0.2 * Math.sin(t * 1.6 + i);
    ctx.shadowColor = acc; ctx.shadowBlur = 6; ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  _drawFlyingGoals() {
    const ctx = state.ctx, { flyingGoals, particles, LEVELS, S } = state;
    for (const fg of flyingGoals) {
      const p = fg.t / fg.maxT;
      ctx.save();
      ctx.shadowColor = LEVELS[fg.level].color; ctx.shadowBlur = 18 * (1 - p * 0.5); ctx.globalAlpha = 1;
      ctx.translate(fg.x, fg.y); ctx.rotate(fg.spinA || 0); ctx.translate(-fg.x, -fg.y);
      this.drawGoalMatrushka(fg.x, fg.y, fg.r, fg.level, fg.contains, 1, false);
      if (p > 0.05 && p < 0.9 && Math.random() < 0.5) {
        particles.push({ x: fg.x+(Math.random()-0.5)*fg.r*0.6, y: fg.y+(Math.random()-0.5)*fg.r*0.6,
          vx: (Math.random()-0.5)*1.5*S, vy: (Math.random()-0.5)*1.5*S,
          r: (2+Math.random()*3)*S, color: LEVELS[fg.level].color, life: 18, maxLife: 18 });
      }
      ctx.restore();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // BLAST BUTONU
  // ════════════════════════════════════════════════════════════════

  drawBlastBtn(rect, enabled) {
    const ctx = state.ctx, { blastBtnAnim, S } = state;
    const isAnim = blastBtnAnim.id === rect.id && blastBtnAnim.t > 0;
    const { x, y, w, h, cx, cy } = rect, col = rect.color;
    const press = isAnim ? h * 0.06 : 0;
    const pulse = enabled ? 1 + 0.04 * Math.sin(Date.now()*0.001*3 + cx*0.01) : 1;

    ctx.save(); ctx.globalAlpha = enabled ? 1 : 0.32;

    // Gölge slab
    this.rrect(x, y + h*0.10 + press, w, h, h*0.5);
    ctx.fillStyle = this.shadeColor(col, -75); ctx.shadowBlur = 0; ctx.fill();

    // Ana pill (pulse + press transform)
    ctx.translate(cx, cy+press); ctx.scale(pulse, pulse); ctx.translate(-cx, -(cy+press));
    this.rrect(x, y+press, w, h, h*0.5);
    const grad = ctx.createLinearGradient(x, y+press, x, y+press+h);
    grad.addColorStop(0, this.shadeColor(col, 65)); grad.addColorStop(0.5, col); grad.addColorStop(1, this.shadeColor(col, -40));
    ctx.fillStyle = grad; ctx.shadowColor = col; ctx.shadowBlur = enabled ? (isAnim ? 32 : 20) : 0; ctx.fill(); ctx.shadowBlur = 0;

    // Koyu outline
    this.rrect(x-2, y+press-2, w+4, h+4, h*0.5+2);
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2.5; ctx.stroke();

    // Üst shine (clip ile)
    ctx.save(); this.rrect(x, y+press, w, h, h*0.5); ctx.clip();
    const shine = ctx.createLinearGradient(x, y+press, x, y+press+h*0.5);
    shine.addColorStop(0, 'rgba(255,255,255,0.30)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    this.rrect(x+3, y+press+3, w-6, h*0.48, h*0.4); ctx.fillStyle = shine; ctx.fill(); ctx.restore();

    // Rim
    this.rrect(x, y+press, w, h, h*0.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.stroke();

    // ⚡ ikon
    const iFs = Math.round(h*0.58);
    ctx.font = `${iFs}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = enabled ? 0.95 : 0.4;
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff';
    ctx.fillText('⚡', cx - w*0.10, cy+press+h*0.02); ctx.shadowBlur = 0;

    // Charge badge
    const cFs  = Math.round(h*0.34), bR = cFs*0.72;
    const bx2  = x+w-bR-5, by2 = y+press+bR+4;
    ctx.font = `bold ${cFs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = enabled ? 1 : 0.35;
    ctx.beginPath(); ctx.arc(bx2, by2, bR, 0, Math.PI*2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 2;
    ctx.fillText(rect.charges, bx2, by2+1);
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════
  // BLAST MERMİSİ
  // ════════════════════════════════════════════════════════════════

  drawBlastProjectiles() {
    state.blastAnims.forEach(b => this._drawOneProjectile(b));
  }

  _drawOneProjectile(b) {
    const ctx = state.ctx, { S } = state;
    const p   = b.t / b.maxT;
    const px  = b.sx + (b.tx - b.sx) * p;
    const py  = b.sy + (b.ty - b.sy) * p;
    const ang = Math.atan2(b.ty - b.sy, b.tx - b.sx);
    const br  = 9 * S;

    // Trail
    for (let k = 1; k <= 5; k++) {
      const tp  = Math.max(0, p - k*0.05);
      const tx2 = b.sx + (b.tx - b.sx)*tp, ty2 = b.sy + (b.ty - b.sy)*tp;
      ctx.save(); ctx.globalAlpha = 0.5 - k*0.08;
      ctx.beginPath(); ctx.arc(tx2, ty2, (br-k*S)*0.7, 0, Math.PI*2);
      ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 6; ctx.fill(); ctx.restore();
    }

    ctx.save(); ctx.translate(px, py);
    // Drop shadow
    ctx.beginPath(); ctx.arc(1.5*S, 2*S, br, 0, Math.PI*2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.shadowBlur=0; ctx.fill();
    // Küre
    const sg = ctx.createRadialGradient(px-br*0.38, py-br*0.38, br*0.02, px+br*0.1, py+br*0.1, br*1.05);
    sg.addColorStop(0, this.shadeColor(b.color,90)); sg.addColorStop(0.3, this.shadeColor(b.color,30));
    sg.addColorStop(0.7, b.color); sg.addColorStop(1, this.shadeColor(b.color,-60));
    ctx.beginPath(); ctx.arc(0, 0, br, 0, Math.PI*2); ctx.fillStyle=sg; ctx.shadowColor=b.color; ctx.shadowBlur=14; ctx.fill();
    // İç halka
    const sg2 = ctx.createRadialGradient(-br*0.2,-br*0.2,0,0,0,br*0.5);
    sg2.addColorStop(0, this.shadeColor(b.color,80)); sg2.addColorStop(1, b.color);
    ctx.beginPath(); ctx.arc(0,0,br*0.5,0,Math.PI*2); ctx.fillStyle=sg2; ctx.shadowBlur=0; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,br*0.12,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.fill();
    ctx.beginPath(); ctx.arc(-br*0.3,-br*0.28,br*0.24,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.50)'; ctx.fill();
    // Fitil + kıvılcım
    const fa=ang-Math.PI*0.75, fx=Math.cos(fa)*br*0.75, fy=Math.sin(fa)*br*0.75;
    ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(fx+Math.cos(fa)*br*0.9, fy+Math.sin(fa)*br*0.9);
    ctx.strokeStyle='#9B7A2F'; ctx.lineWidth=1.8*S; ctx.lineCap='round'; ctx.shadowBlur=0; ctx.stroke();
    const spx=fx+Math.cos(fa)*br*0.9, spy=fy+Math.sin(fa)*br*0.9;
    [[-0.7,-1],[0.7,-1],[0,-1.2]].forEach(([dx,dy])=>{
      ctx.beginPath(); ctx.moveTo(spx,spy); ctx.lineTo(spx+dx*br*0.4, spy+dy*br*0.4);
      ctx.strokeStyle='#FFE040'; ctx.lineWidth=1.5*S; ctx.shadowColor='#FFE040'; ctx.shadowBlur=5; ctx.stroke();
    });
    ctx.restore();
  }

  // ════════════════════════════════════════════════════════════════
  // EFEKTİF PARÇACIKLAR / DALGALAR
  // ════════════════════════════════════════════════════════════════

  drawParticles() {
    const ctx = state.ctx, { particles } = state;
    ctx.shadowBlur = 0;
    let lastColor = null;
    for (let i = particles.length-1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; p.r *= 0.96;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life / p.maxLife;
      if (p.color !== lastColor) { ctx.fillStyle = p.color; lastColor = p.color; }
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawChainWaves() {
    const ctx = state.ctx, { chainWaves, S } = state;
    for (let i = 0; i < chainWaves.length; i++) {
      const w = chainWaves[i];
      const p = w.t / w.maxT;
      const alpha = (1-p)*0.7;
      if (alpha < 0.02) continue;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI*2);
      ctx.strokeStyle = w.color; ctx.lineWidth = (4-p*3)*S;
      ctx.shadowColor = w.color; ctx.shadowBlur = 8*(1-p);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawAbsorbAnims() {
    const ctx = state.ctx, { absorbingInto } = state;
    for (const a of absorbingInto) {
      const p=a.t/a.maxT, ep=1-(1-p)**2;
      const cx=a.x+(a.tx-a.x)*ep, cy=a.y+(a.ty-a.y)*ep, cr=Math.max(0.1,a.r*(1-ep*0.8));
      ctx.save(); ctx.globalAlpha = 1-ep*0.9;
      ctx.beginPath(); ctx.arc(cx,cy,cr,0,Math.PI*2);
      const sg=ctx.createRadialGradient(cx-cr*0.25,cy-cr*0.3,cr*0.01,cx,cy,cr);
      sg.addColorStop(0,this.shadeColor(a.color,80)); sg.addColorStop(0.4,a.color); sg.addColorStop(1,this.shadeColor(a.color,-60));
      ctx.fillStyle=sg; ctx.shadowColor=a.color; ctx.shadowBlur=10*(1-p); ctx.fill(); ctx.restore();
    }
  }

  drawActionTexts() {
    const ctx = state.ctx, { actionTexts, S } = state;
    actionTexts.forEach(at => {
      ctx.save(); ctx.globalAlpha = Math.max(0, at.alpha);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`bold ${Math.round(32*S)}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
      ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=3*S; ctx.lineJoin='round'; ctx.strokeText(at.text, at.x, at.y);
      ctx.fillStyle=at.color; ctx.shadowColor=at.color; ctx.shadowBlur=8*at.alpha; ctx.fillText(at.text, at.x, at.y);
      ctx.restore();
    });
  }

  drawComboDisplays() {
    const ctx = state.ctx, { comboDisplays, S } = state;
    const COLORS = ['#FFCC00','#FFCC00','#FFCC00','#FF9500','#FF1744','#FF6D00','#AA00FF','#00B0FF','#00C853'];
    comboDisplays.forEach(cd => {
      const mult = parseInt(cd.text.replace('COMBO x',''));
      const col  = COLORS[Math.min(mult, COLORS.length-1)];
      ctx.save(); ctx.globalAlpha = Math.max(0, cd.alpha);
      ctx.translate(cd.x, cd.y); ctx.scale(cd.scale, cd.scale);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`italic bold ${Math.round((28+mult*4)*S)}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
      ctx.strokeStyle='#fff'; ctx.lineWidth=4*S; ctx.lineJoin='round'; ctx.strokeText(cd.text,0,0);
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.shadowBlur=0; ctx.fillText(cd.text,2*S,3*S);
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=14; ctx.fillText(cd.text,0,0);
      ctx.restore();
    });
  }

  // ════════════════════════════════════════════════════════════════
  // OVERLAY'LER: SUCCESS / PAUSE / GAMEOVER
  // ════════════════════════════════════════════════════════════════

  drawSuccessOverlay(goalManager) {
    const { levelSuccess, levelSuccessAlpha, currentLevel, levelStars, W, H, CX, CY, S } = state;
    if (!levelSuccess || levelSuccessAlpha <= 0) { state._nextLevelBtn = null; return; }

    const ctx = state.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${levelSuccessAlpha*0.78})`; ctx.fillRect(0, 0, W, H);

    if (levelSuccessAlpha > 0.25) {
      const a          = Math.min(1, (levelSuccessAlpha-0.1)/0.6);
      const tt         = Date.now() * 0.001;
      const isTutorial = currentLevel < TUTORIAL_LEVELS;

      this._drawSuccessTitle(a, tt, isTutorial, currentLevel, CX, CY, S);
      if (isTutorial)  this._drawTutorialDemo(a, tt, currentLevel);
      if (!isTutorial) this._drawStars(a, tt, levelStars, CX, CY, S);
      this._drawNextLevelBtn(a, tt, isTutorial, currentLevel, W, CX, CY, S);
    }
    ctx.restore();
  }

  _drawSuccessTitle(a, tt, isTutorial, currentLevel, CX, CY, S) {
    const ctx   = state.ctx;
    const scl   = a < 0.4 ? 0.5+a*1.25 : 1+0.03*Math.sin(tt*4);
    ctx.save(); ctx.translate(CX, CY-130*S); ctx.scale(scl, scl);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if (isTutorial) {
      const msg = ['Merge & Absorb!','Chain Mastered!','Ready to Play!'][currentLevel] || 'Well done!';
      ctx.font=`bold ${Math.round(46*S)}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
      ctx.strokeStyle=`rgba(255,255,255,${a*0.5})`; ctx.lineWidth=4*S; ctx.lineJoin='round'; ctx.strokeText(msg,0,0);
      ctx.fillStyle=`rgba(255,220,60,${a})`; ctx.shadowColor='#FFD700'; ctx.shadowBlur=20*a; ctx.fillText(msg,0,0);
    } else {
      ctx.font=`bold ${Math.round(58*S)}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
      ctx.strokeStyle=`rgba(255,255,255,${a*0.5})`; ctx.lineWidth=5*S; ctx.lineJoin='round'; ctx.strokeText('SUCCESS!',0,0);
      ctx.fillStyle=`rgba(255,220,60,${a})`; ctx.shadowColor='#FFD700'; ctx.shadowBlur=22*a; ctx.fillText('SUCCESS!',0,0);
    }
    ctx.restore(); ctx.shadowBlur=0;
  }

  _drawStars(a, tt, levelStars, CX, CY, S) {
    const ctx   = state.ctx;
    const starR = Math.round(22*S), starGap = starR*2.6, starY = CY-32*S;
    for (let si = 0; si < 3; si++) {
      const sx     = CX+(si-1)*starGap;
      const filled = si < levelStars;
      const starA  = Math.min(1, Math.max(0, (a-si*0.18)/0.35));
      const sc     = filled ? (starA<0.5 ? starA*2.4 : 1.2-(starA-0.5)*0.4) : 1;
      const pulse  = filled ? 1+0.06*Math.sin(tt*3+si*1.2) : 1;

      ctx.save(); ctx.globalAlpha = filled ? starA : a*0.4;
      ctx.translate(sx, starY); ctx.scale(sc*pulse, sc*pulse);
      ctx.beginPath();
      for (let pt=0; pt<5; pt++) {
        const a1=(pt*4*Math.PI/5)-Math.PI/2, a2=a1+2*Math.PI/5;
        const ox=Math.cos(a1)*starR, oy=Math.sin(a1)*starR;
        const ix=Math.cos(a2)*starR*0.42, iy=Math.sin(a2)*starR*0.42;
        pt===0 ? ctx.moveTo(ox,oy) : ctx.lineTo(ox,oy); ctx.lineTo(ix,iy);
      }
      ctx.closePath();
      if (filled) {
        const sg=ctx.createRadialGradient(-starR*0.2,-starR*0.2,0,0,0,starR);
        sg.addColorStop(0,'#FFF176'); sg.addColorStop(0.5,'#FFD700'); sg.addColorStop(1,'#FF8F00');
        ctx.fillStyle=sg; ctx.shadowColor='#FFD700'; ctx.shadowBlur=14; ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.shadowBlur=0; ctx.stroke();
      } else {
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1.5; ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawNextLevelBtn(a, tt, isTutorial, currentLevel, W, CX, CY, S) {
    const ctx   = state.ctx;
    const bw    = Math.min(Math.round(W*0.78), 340), bh = Math.round(Math.max(62, 68*S));
    const bx    = CX-bw/2, by = CY+32*S;
    const pulse = 1+0.05*Math.sin(tt*3), btnA = Math.min(1, a*1.4);
    const isLast = currentLevel === TUTORIAL_LEVELS-1;
    const c0=isLast?'#2979FF':'#00E676', c1=isLast?'#1565C0':'#00C853', c2=isLast?'#0D47A1':'#00952e';
    const glow=isLast?'#448AFF':'#00E676', glowRgb=isLast?'41,121,255':'0,230,118';

    ctx.save(); ctx.globalAlpha=btnA;
    ctx.translate(CX,by+bh/2); ctx.scale(pulse,pulse); ctx.translate(-CX,-(by+bh/2));

    this.rrect(bx-6,by-6,bw+12,bh+12,bh*0.55+6);
    ctx.strokeStyle=`rgba(${glowRgb},0.35)`; ctx.lineWidth=6; ctx.shadowColor=glow; ctx.shadowBlur=22; ctx.stroke(); ctx.shadowBlur=0;

    const grad=ctx.createLinearGradient(bx,by,bx,by+bh);
    grad.addColorStop(0,c0); grad.addColorStop(0.48,c1); grad.addColorStop(1,c2);
    this.rrect(bx,by,bw,bh,bh*0.45); ctx.fillStyle=grad; ctx.shadowColor=glow; ctx.shadowBlur=28; ctx.fill(); ctx.shadowBlur=0;

    const shineG=ctx.createLinearGradient(bx,by,bx,by+bh*0.52);
    shineG.addColorStop(0,'rgba(255,255,255,0.36)'); shineG.addColorStop(1,'rgba(255,255,255,0)');
    this.rrect(bx+4,by+3,bw-8,bh*0.5,bh*0.38); ctx.fillStyle=shineG; ctx.fill();

    this.rrect(bx,by,bw,bh,bh*0.45); ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1.5; ctx.stroke();

    let lbl;
    if (isLast)          lbl='▶  Start Game';
    else if (isTutorial) lbl='Next  ▶';
    else {
      const n=(currentLevel+1)<TUTORIAL_LEVELS ? 'How to Play '+(currentLevel+2) : 'Level '+(currentLevel+2-TUTORIAL_LEVELS);
      lbl=`${n}  ▶`;
    }
    const fs=Math.round(Math.max(22,26*S));
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillText(lbl,CX+1.5,by+bh*0.52+2);
    ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=4; ctx.fillText(lbl,CX,by+bh*0.5); ctx.shadowBlur=0;
    ctx.restore();
    state._nextLevelBtn = { x:bx, y:by, w:bw, h:bh, a:btnA };
  }

  drawPauseBtn() {
    const ctx = state.ctx, { W, SCORE_AREA, isPaused, levelSuccess } = state;
    if (levelSuccess) { state._pauseBtn=null; return; }
    const ICON_PX=44, iconPad=10;
    const pcx=W-iconPad-ICON_PX/2, pcy=SCORE_AREA/2;
    ctx.save(); ctx.globalAlpha=0.75; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=6; ctx.fillStyle='#fff';
    if (isPaused) {
      const bh=ICON_PX*(1/3);
      ctx.beginPath(); ctx.moveTo(pcx-bh*0.5,pcy-bh); ctx.lineTo(pcx+bh,pcy); ctx.lineTo(pcx-bh*0.5,pcy+bh); ctx.closePath(); ctx.fill();
    } else {
      const bw=ICON_PX*0.13, bh=ICON_PX*(2/3), gap=ICON_PX*0.20;
      const bx1=pcx-gap/2-bw, bx2=pcx+gap/2, by=pcy-bh/2;
      this.rrect(bx1,by,bw,bh,bw*0.5); ctx.fill();
      this.rrect(bx2,by,bw,bh,bw*0.5); ctx.fill();
    }
    ctx.restore();
    state._pauseBtn = { x:pcx-ICON_PX, y:pcy-ICON_PX, w:ICON_PX*2, h:ICON_PX*2 };
  }

  drawSoundBtn() {
    const ctx = state.ctx, { W, SCORE_AREA, isMuted, levelSuccess } = state;
    if (levelSuccess) { state._soundBtn = null; return; }
    const ICON_PX = 44, iconPad = 10;
    // Pause ile aynı X, onun altında
    const pcx = W - iconPad - ICON_PX / 2;
    const pcy = SCORE_AREA / 2 + ICON_PX + 4;
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = ICON_PX * 0.12;
    ctx.lineCap = 'round';
    const s = ICON_PX * 0.38;
    // Hoparlör gövdesi
    ctx.beginPath();
    ctx.moveTo(pcx - s * 0.55, pcy - s * 0.38);
    ctx.lineTo(pcx - s * 0.18, pcy - s * 0.38);
    ctx.lineTo(pcx + s * 0.18, pcy - s * 0.72);
    ctx.lineTo(pcx + s * 0.18, pcy + s * 0.72);
    ctx.lineTo(pcx - s * 0.18, pcy + s * 0.38);
    ctx.lineTo(pcx - s * 0.55, pcy + s * 0.38);
    ctx.closePath();
    ctx.fill();
    if (!isMuted) {
      // Ses dalgaları
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(pcx + s * 0.18, pcy, s * 0.55, -Math.PI * 0.38, Math.PI * 0.38); ctx.stroke();
      ctx.beginPath(); ctx.arc(pcx + s * 0.18, pcy, s * 0.90, -Math.PI * 0.30, Math.PI * 0.30); ctx.stroke();
    } else {
      // X işareti
      ctx.shadowBlur = 0;
      ctx.lineWidth = ICON_PX * 0.13;
      const x1 = pcx + s * 0.28, y1 = pcy - s * 0.52;
      const x2 = pcx + s * 0.80, y2 = pcy + s * 0.52;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x1, y2); ctx.stroke();
    }
    ctx.restore();
    state._soundBtn = { x: pcx - ICON_PX, y: pcy - ICON_PX, w: ICON_PX * 2, h: ICON_PX * 2 };
  }

  drawPauseOverlay() {
    const ctx = state.ctx, { W, H, CX, CY } = state;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    const pFs=28, rbw=220, rbh=56, blockTop=CY-(pFs+20+rbh)/2;
    ctx.font=`bold ${pFs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.fillStyle='#fff'; ctx.shadowColor='#fff'; ctx.shadowBlur=4;
    ctx.fillText('PAUSED', CX, blockTop+pFs*0.5);
    const rbx=CX-rbw/2, rby=blockTop+pFs+20;
    this.rrect(rbx,rby,rbw,rbh,rbh*0.4);
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.shadowBlur=0; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font=`bold 22px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.fillText('▶  Play', CX, rby+rbh*0.55);
    ctx.restore();
    state._resumeBtn = { x:rbx, y:rby, w:rbw, h:rbh };
  }

  drawGameOver(goalManager) {
    const ctx = state.ctx, { gameOverAlpha, W, H, CX, CY, S } = state;
    ctx.fillStyle=`rgba(10,5,30,${gameOverAlpha*0.82})`; ctx.fillRect(0,0,W,H);
    if (gameOverAlpha <= 0.2) return;
    const a=Math.min(1,(gameOverAlpha-0.1)/0.6), tt=Date.now()*0.001;
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    // Emoji
    ctx.font=`${Math.round(64*S)}px sans-serif`; ctx.globalAlpha=a; ctx.fillText('😵',CX,CY-110*S);
    // Başlık
    ctx.font=`bold ${Math.round(38*S)}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.fillStyle='#fff'; ctx.shadowColor='rgba(255,50,50,0.6)'; ctx.shadowBlur=18;
    ctx.fillText('GAME OVER',CX,CY-52*S); ctx.shadowBlur=0;
    // Level pill
    this._drawLevelPill(a, goalManager, CX, CY, S);
    // Play Again butonu
    this._drawPlayAgainBtn(a, tt, W, CX, CY, S);
    ctx.restore();
  }

  _drawLevelPill(a, goalManager, CX, CY, S) {
    const ctx=state.ctx, lTxt=goalManager.displayLevelText(), lFs=Math.round(22*S);
    ctx.font=`bold ${lFs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    const pW=ctx.measureText(lTxt).width+32*S, pH=lFs+16*S;
    const px=CX-pW/2, py=CY-pH/2+4*S;
    ctx.globalAlpha=a*0.9;
    this.rrect(px,py,pW,pH,pH*0.5); ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.globalAlpha=a; ctx.fillText(lTxt,CX,py+pH*0.52);
  }

  _drawPlayAgainBtn(a, tt, W, CX, CY, S) {
    const ctx=state.ctx;
    const bw=Math.min(260,W*0.68), bh=Math.round(58*S), bx=CX-bw/2, by=CY+48*S;
    const pulse=1+0.04*Math.sin(tt*3.2);
    ctx.globalAlpha=a; ctx.save();
    ctx.translate(CX,by+bh/2); ctx.scale(pulse,pulse); ctx.translate(-CX,-(by+bh/2));
    this.rrect(bx-5,by-5,bw+10,bh+10,bh*0.55+5);
    ctx.strokeStyle='rgba(0,230,118,0.3)'; ctx.lineWidth=6; ctx.shadowColor='#00E676'; ctx.shadowBlur=20; ctx.stroke(); ctx.shadowBlur=0;
    const grad=ctx.createLinearGradient(bx,by,bx,by+bh);
    grad.addColorStop(0,'#00E676'); grad.addColorStop(0.5,'#00C853'); grad.addColorStop(1,'#00952e');
    this.rrect(bx,by,bw,bh,bh*0.45); ctx.fillStyle=grad; ctx.shadowColor='#00E676'; ctx.shadowBlur=24; ctx.fill(); ctx.shadowBlur=0;
    const shine=ctx.createLinearGradient(bx,by,bx,by+bh*0.5);
    shine.addColorStop(0,'rgba(255,255,255,0.32)'); shine.addColorStop(1,'rgba(255,255,255,0)');
    this.rrect(bx+4,by+3,bw-8,bh*0.48,bh*0.38); ctx.fillStyle=shine; ctx.fill();
    this.rrect(bx,by,bw,bh,bh*0.45); ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1.5; ctx.stroke();
    const fs=Math.round(22*S);
    ctx.font=`bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillText('▶  Play Again',CX+1.5,by+bh*0.52+2);
    ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.25)'; ctx.shadowBlur=4; ctx.fillText('▶  Play Again',CX,by+bh*0.5);
    ctx.restore();
    state._gameOverBtn = { x:bx, y:by, w:bw, h:bh };
  }

  // ════════════════════════════════════════════════════════════════
  // TUTORIAL DEMO ANİMASYONU
  // ════════════════════════════════════════════════════════════════

  _drawTutorialDemo(a, tt, currentLevel) {
    const { CX, CY, S } = state;
    const demoY = CY - 50 * S;
    const demoA = Math.min(1, Math.max(0, (a-0.1)/0.7));
    if      (currentLevel === 0) this._demoLevel0(demoA, tt, demoY, CX, S);
    else if (currentLevel === 1) this._demoLevel1(demoA, tt, demoY, CX, S);
    else                          this._demoLevel2(demoA, demoY, CX, S);
  }

  _demoBall(x, y, r, col) {
    const ctx=state.ctx;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
  }

  _demoLevel0(demoA, tt, demoY, CX, S) {
    const ctx=state.ctx, colX=CX-60*S, colX2=CX+60*S, lfs=Math.round(Math.max(11,13*S));
    ctx.save(); ctx.globalAlpha=demoA;
    // Sol: MERGE
    const ph=tt%3.6;
    if (ph<1.0){ const dist=36*(1-ph); this._demoBall(colX-dist,demoY,14,'#FFCC00'); this._demoBall(colX+dist,demoY,14,'#FFCC00');
      if(dist>10){ ctx.globalAlpha=demoA*0.6; ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(12*S)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('→',colX-dist/2-18,demoY); ctx.fillText('←',colX+dist/2+18,demoY); ctx.globalAlpha=demoA; }
    } else if(ph<1.5){ ctx.globalAlpha=demoA*Math.min(1,(ph-1)/0.3); this._demoBall(colX,demoY,18,'#00C853'); }
    else { this._demoBall(colX,demoY,18,'#00C853'); }
    // Sağ: ABSORB zinciri
    const ph2=tt%4.8, gR=20,yR=15,oR=10,gap=44*S, gX=colX2-gap, yX=colX2, oX=colX2+gap;
    ctx.globalAlpha=demoA;
    if(ph2<1.2){ this._demoBall(gX,demoY,gR,'#00C853'); this._demoBall(yX,demoY,yR,'#FFCC00'); this._demoBall(oX,demoY,oR,'#FF9500');
      ctx.globalAlpha=demoA*(0.5+0.5*Math.abs(Math.sin(tt*5))*0.5+0.25); ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(13*S)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('←',oX-oR-10*S,demoY);
    } else if(ph2<2.0){ const e=1-(1-(ph2-1.2)/0.8)**2; this._demoBall(gX,demoY,gR,'#00C853'); this._demoBall(yX,demoY,yR,'#FFCC00'); ctx.globalAlpha=demoA*(1-e*0.95); this._demoBall(oX+(yX-oX)*e,demoY,oR*(1-e*0.5),'#FF9500'); ctx.globalAlpha=demoA;
    } else if(ph2<2.4){ const t2=Math.min(1,(ph2-2)/0.3); this._demoBall(gX,demoY,gR,'#00C853'); this._demoBall(yX,demoY,yR,'#FFCC00'); ctx.globalAlpha=demoA*t2; ctx.beginPath(); ctx.arc(yX,demoY,oR*0.72,0,Math.PI*2); ctx.fillStyle='#FF9500'; ctx.fill(); ctx.globalAlpha=demoA;
    } else if(ph2<3.2){ this._demoBall(gX,demoY,gR,'#00C853'); this._demoBall(yX,demoY,yR,'#FFCC00'); ctx.beginPath(); ctx.arc(yX,demoY,oR*0.72,0,Math.PI*2); ctx.fillStyle='#FF9500'; ctx.fill(); ctx.globalAlpha=demoA*(0.5+0.5*Math.abs(Math.sin(tt*5))*0.5+0.25); ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(13*S)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('←',yX-yR-10*S,demoY); ctx.globalAlpha=demoA;
    } else if(ph2<4.0){ const e=1-(1-(ph2-3.2)/0.8)**2; this._demoBall(gX,demoY,gR,'#00C853'); ctx.globalAlpha=demoA*(1-e*0.95); this._demoBall(yX+(gX-yX)*e,demoY,yR*(1-e*0.5),'#FFCC00'); ctx.beginPath(); ctx.arc(yX+(gX-yX)*e,demoY,oR*0.72*(1-e*0.5),0,Math.PI*2); ctx.fillStyle='#FF9500'; ctx.fill(); ctx.globalAlpha=demoA;
    } else { const t2=Math.min(1,(ph2-4)/0.4); ctx.globalAlpha=demoA*t2; this._demoBall(gX,demoY,gR,'#00C853'); ctx.beginPath(); ctx.arc(gX,demoY,yR*0.72,0,Math.PI*2); ctx.fillStyle='#FFCC00'; ctx.fill(); ctx.beginPath(); ctx.arc(gX,demoY,oR*0.55,0,Math.PI*2); ctx.fillStyle='#FF9500'; ctx.fill(); ctx.globalAlpha=demoA; }
    ctx.restore();
    ctx.save(); ctx.globalAlpha=demoA*0.85; ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.font=`bold ${lfs}px "ui-rounded",sans-serif`;
    ctx.fillStyle='#FFCC00'; ctx.fillText('MERGE',colX,demoY+22);
    ctx.fillStyle='#00C853'; ctx.fillText('ABSORB',colX2,demoY+22); ctx.restore();
  }

  _demoLevel1(demoA, tt, demoY, CX, S) {
    const ctx=state.ctx, ph=tt%4.0, yR=26,oR=18,pR=11;
    const yX0=CX-72*S, oX0=CX, pX0=CX+56*S;
    ctx.save(); ctx.globalAlpha=demoA;
    if(ph<1.2){ this._demoBall(yX0,demoY,yR,'#FFCC00'); this._demoBall(oX0,demoY,oR,'#FF9500'); this._demoBall(pX0,demoY,pR,'#FF5EBC'); ctx.globalAlpha=demoA*(0.5+0.5*Math.abs(Math.sin(tt*5))*0.5+0.25); ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(14*S)}px sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('→',oX0+oR+10*S,demoY);
    } else if(ph<2.0){ const e=1-(1-(ph-1.2)/0.8)**2, pX=pX0+(oX0-pX0)*e; this._demoBall(yX0,demoY,yR,'#FFCC00'); this._demoBall(oX0,demoY,oR,'#FF9500'); ctx.globalAlpha=demoA*(1-e*0.95); this._demoBall(pX,demoY,pR*(1-e*0.5),'#FF5EBC'); ctx.globalAlpha=demoA;
    } else if(ph<2.6){ const e=1-(1-(ph-2.0)/0.6)**2, yX=yX0+(oX0-yX0)*e; this._demoBall(oX0,demoY,oR,'#FF9500'); ctx.beginPath(); ctx.arc(oX0,demoY,pR*0.72,0,Math.PI*2); ctx.fillStyle='#FF5EBC'; ctx.fill(); ctx.globalAlpha=demoA*(1-e*0.95); this._demoBall(yX,demoY,yR*(1-e*0.5),'#FFCC00'); ctx.globalAlpha=demoA;
    } else if(ph<3.4){ const t2=Math.min(1,(ph-2.6)/0.4); ctx.globalAlpha=demoA*t2; this._demoBall(CX,demoY,yR,'#FFCC00'); ctx.beginPath(); ctx.arc(CX,demoY,oR*0.72,0,Math.PI*2); ctx.fillStyle='#FF9500'; ctx.fill(); ctx.beginPath(); ctx.arc(CX,demoY,pR*0.62,0,Math.PI*2); ctx.fillStyle='#FF5EBC'; ctx.fill();
    } else { const t2=1-(ph-3.4)/0.6; ctx.globalAlpha=demoA*t2; this._demoBall(CX,demoY,yR,'#FFCC00'); ctx.beginPath(); ctx.arc(CX,demoY,oR*0.72,0,Math.PI*2); ctx.fillStyle='#FF9500'; ctx.fill(); ctx.beginPath(); ctx.arc(CX,demoY,pR*0.62,0,Math.PI*2); ctx.fillStyle='#FF5EBC'; ctx.fill(); }
    ctx.restore();
    const lbl=ph<1.2?'Chain reaction!':ph<2.6?'Absorbing...':ph<3.4?'Chain complete!':'';
    if(lbl){ ctx.save(); ctx.globalAlpha=demoA*0.8; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font=`bold ${Math.round(Math.max(11,13*S))}px "ui-rounded",sans-serif`; ctx.fillStyle='#fff'; ctx.fillText(lbl,CX,demoY+yR+10); ctx.restore(); }
  }

  _demoLevel2(demoA, demoY, CX, S) {
    const ctx=state.ctx, fs=Math.round(Math.max(14,16*S));
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=`${Math.round(48*S)}px sans-serif`; ctx.globalAlpha=demoA; ctx.fillText('🎯',CX,demoY-10);
    ctx.font=`bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`; ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText('All moves learned.',CX,demoY+42); ctx.fillText('Good luck! 🎉',CX,demoY+42+fs+8);
    ctx.restore();
  }
  // ── Palet rehberi ──────────────────────────────────────────────────
  _paletteGuideCache = null;

  _invalidatePaletteGuide() { this._paletteGuideCache = null; }

  drawPaletteGuide(goalManager) {
    const { ctx, LEVELS, S, CY, MAIN_R } = state;
    if (!LEVELS || LEVELS.length === 0) return;

    // 1) Çizim alanı: ilk slotun üstü → son slotun altı
    let topY = 20, botY = CY - MAIN_R;
    if (goalManager) {
      try {
        const def    = goalManager.getLevelDef();
        const sp0    = goalManager.goalSlotPos(0);
        const spLast = goalManager.goalSlotPos((def?.goals?.length || 1) - 1);
        if (sp0?.cy != null) {
          topY = sp0.cy   - sp0.gemR;
          botY = spLast.cy + spLast.gemR;
        }
      } catch (_) {}
    }
    const availH = botY - topY;
    if (availH < 10) return;

    // 2) Scale: 7 top + 6 ok birlikte availH'a sığacak
    //    ok yüksekliği = en küçük top çapının %60'ı (sabit oran)
    //    sc * (sumR2 + 6 * 2*r0*0.6) = availH  →  sc = availH / (sumR2 + 6*1.2*r0)
    const n      = LEVELS.length;                                   // 7
    const sumR2  = LEVELS.reduce((s, lv) => s + lv.r * 2, 0);
    const r0raw  = LEVELS[0].r;
    const arrowPerSlot = r0raw * 1.2;                              // ok + boşluk = küçük top çapının %60'ı
    const sc     = availH / (sumR2 + (n - 1) * arrowPerSlot);
    if (sc <= 0) return;

    const aH     = r0raw * sc * 0.5;   // ok üçgeninin yüksekliği
    const gp     = r0raw * sc * 0.1;   // ok üstü/altı boşluk

    // 3) Canvas genişliği: en büyük top sığacak kadar
    const maxR   = LEVELS[n - 1].r * sc;
    const padL   = 4 * S;
    const guideX = padL + maxR;
    const logW   = Math.ceil(padL + maxR * 2 + 4 * S);
    const logH   = Math.ceil(availH);

    const themeKey = (state.theme?.cpIdx ?? 0) + '|' + sc.toFixed(4) + '|' + logW + '|' + Math.round(topY) + '|' + Math.round(botY);

    if (!this._paletteGuideCache || this._paletteGuideCache.themeKey !== themeKey) {
      const DPR  = Math.min(window.devicePixelRatio || 1, 2);
      const oc   = new OffscreenCanvas(Math.ceil(logW * DPR), Math.ceil(logH * DPR));
      const octx = oc.getContext('2d');
      octx.scale(DPR, DPR);

      let curY = 0;
      for (let i = 0; i < n; i++) {
        const lv    = LEVELS[i];
        const shape = lv.shape || 'sphere';
        const r     = lv.r * sc;
        const cx    = guideX, cy = curY + r;

        const saved = state.ctx;
        state.ctx   = octx;
        octx.shadowBlur = 0;
        this.drawSphere({ x: cx, y: cy, r, level: i, color: lv.color, shape,
          contains: [], boing: 0, absorbAnim: 0, squish: null, absorbGlow: 0, isBeingDragged: false });
        state.ctx = saved;

        if (i < n - 1) {
          // ok: küçük aşağı üçgen
          const aw     = Math.max(1.5, aH * 0.7);
          const lineT  = cy + r + gp;
          const arrowY = lineT + aH * 0.5;
          octx.globalAlpha = 0.5;
          octx.fillStyle   = 'rgba(200,200,200,0.7)';
          octx.beginPath();
          octx.moveTo(cx - aw, arrowY - aH * 0.4);
          octx.lineTo(cx + aw, arrowY - aH * 0.4);
          octx.lineTo(cx,      arrowY + aH * 0.6);
          octx.closePath();
          octx.fill();
          octx.globalAlpha = 1;
        }
        curY += r * 2 + aH + gp * 2;
      }

      this._paletteGuideCache = { oc, themeKey, topY, logW, logH };
    }

    const c = this._paletteGuideCache;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowBlur  = 0;
    ctx.drawImage(c.oc, 0, c.topY, c.logW, c.logH);
    ctx.restore();
  }


}
