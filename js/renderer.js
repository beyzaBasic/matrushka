// ── renderer.js ───────────────────────────────────────────────────
import { state } from './state.js';
import { TUTORIAL_LEVELS } from './constants.js';

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

  shadeColor(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + amt));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
    const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
    return `rgb(${r},${g},${b})`;
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

  drawSphere(c) {
    const ctx = state.ctx;
    const { S, gameTime, LEVELS } = state;
    const scale = c.boing > 0 ? 1 + Math.sin(c.boing * Math.PI) * 0.25 : 1;
    const dr    = Math.max(0.1, c.r * scale);

    this._drawAbsorbHalo(c, dr, S, gameTime, LEVELS);

    const { rx, ry, ax, ay, hasSquish } = this._squishParams(c, dr);
    const path = () => hasSquish
      ? this._ellipsePath(c.x, c.y, rx, ry, ax, ay)
      : (ctx.beginPath(), ctx.arc(c.x, c.y, dr, 0, Math.PI * 2));

    ctx.save();
    if (c.absorbAnim > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 28 * (c.absorbAnim / 35); }

    path(); ctx.fillStyle = this._candyGrad(c.x, c.y, dr, c.color); ctx.fill();
    this._drawInnerRings(c, dr, ax, ay, hasSquish);

    path(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = dr * 0.07; ctx.stroke();
    this._drawSpecular(c, dr, path);
    this._drawBottomGleam(c, dr);

    ctx.restore();
  }

  _drawAbsorbHalo(c, dr, S, gameTime, LEVELS) {
    const glow = c.absorbGlow || 0;
    if (glow <= 0.01) return;
    const ctx      = state.ctx;
    const bigColor = LEVELS[c.level + 1] ? LEVELS[c.level + 1].color : '#fff';
    const hareR    = dr + 5*S + glow*7*S;
    const offset   = (gameTime * 0.003) % (Math.PI * 2);
    ctx.save();
    ctx.lineWidth   = 3*S + glow*3*S; ctx.lineCap = 'round';
    ctx.shadowColor = bigColor; ctx.shadowBlur = 10 + glow*18;
    ctx.strokeStyle = bigColor; ctx.globalAlpha = 0.4 + glow*0.6;
    for (let s = 0; s < 8; s++) {
      const seg   = (Math.PI * 2) / 8;
      const start = offset + s * seg;
      ctx.beginPath(); ctx.arc(c.x, c.y, hareR, start, start + seg * 0.65); ctx.stroke();
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
    const fakeC = { x, y, r, level, color: LEVELS[level]?.color || '#fff', contains,
      boing: 0, absorbAnim: done ? 20 : 0, squish: null, absorbGlow: 0, isBeingDragged: false };
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
      : (state.theme?.arenaBase || LEVELS[def.goals.reduce((mx, g) => Math.max(mx, g.level), 0)]?.color || LEVELS[0].color);
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
    for (let i = particles.length-1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; p.r *= 0.96;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = p.color; ctx.fill();
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  drawChainWaves() {
    const ctx = state.ctx, { chainWaves, S } = state;
    chainWaves.forEach(w => {
      const p = w.t / w.maxT;
      ctx.save(); ctx.globalAlpha = (1-p)*0.7;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI*2);
      ctx.strokeStyle=w.color; ctx.lineWidth=(4-p*3)*S; ctx.shadowColor=w.color; ctx.shadowBlur=12*(1-p); ctx.stroke();
      ctx.restore();
    });
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
  // ── Palet rehberi — Level title top → slot bottom arası, dikey chain ──
  drawPaletteGuide() {
    const { ctx, LEVELS, S, CX, CY, MAIN_R, MIN_DIM } = state;
    if (!LEVELS || LEVELS.length === 0) return;

    const n = LEVELS.length;
    const t = Date.now() * 0.001;

    // ── Koordinat referansları (goalSlotPos ile aynı formül) ──────────
    // Title: y=22, font=28*S → top = 22 - fontSize/2
    const titleFontH = Math.round(28 * S);
    const titleTop   = 22 - titleFontH / 2 - 2 * S;

    // Slot bottom: goalSlotPos(0) hesabı (goals.js ile senkron)
    const nGoals  = state.goalSlots ? state.goalSlots.length : 1;
    const GEM_R   = nGoals <= 1 ? 64 : nGoals === 2 ? 54 : 44;
    const TOP = 10, TTL = Math.round(28 * MIN_DIM / 800) + 8, MID = 4;
    const gemTop  = TOP + TTL + MID;
    const slotBot = gemTop + GEM_R * 2 + 6 * S;   // slot alt kenarı + küçük pad

    // ── Chain: title top → slot bottom arasına tam sığsın ─────────
    const availH = slotBot - Math.max(0, titleTop);
    const arrowH = Math.max(3, Math.round(5 * S));
    const gap    = Math.max(1, Math.round(2 * S));
    const arrowSpace = (n - 1) * (arrowH + gap * 2);

    // scale: availH'e tam sığacak şekilde hesapla
    const sumR2  = LEVELS.reduce((s, lv) => s + lv.r * 2, 0);
    const scale  = (availH - arrowSpace) / sumR2;

    const radii  = LEVELS.map(lv => Math.max(3, Math.round(lv.r * scale)));
    const totalH = radii.reduce((s, r) => s + r * 2, 0) + arrowSpace;

    // X: sol kenara yasla — en büyük top + padding
    const guideX = radii[n - 1] + Math.round(8 * S);

    // startY: title top'tan başla
    const startY = Math.max(2, titleTop);

    ctx.save();

    let curY = startY;

    for (let i = 0; i < n; i++) {
      const lv    = LEVELS[i];
      const r     = radii[i];
      const cx    = guideX;
      const cy    = curY + r;
      const pulse = 0.78 + 0.22 * Math.sin(t * 2.2 + i * 0.85);

      ctx.globalAlpha = pulse * 0.92;

      // Top — candy gradient
      const g = ctx.createRadialGradient(cx - r*0.25, cy - r*0.3, r*0.05, cx, cy, r);
      g.addColorStop(0,    this.shadeColor(lv.color, 80));
      g.addColorStop(0.35, lv.color);
      g.addColorStop(1,    this.shadeColor(lv.color, -60));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle   = g;
      ctx.shadowColor = lv.color;
      ctx.shadowBlur  = 4 * S;
      ctx.fill();

      // Specular
      ctx.shadowBlur = 0;
      const sg = ctx.createRadialGradient(cx-r*0.28, cy-r*0.28, 0, cx-r*0.28, cy-r*0.28, r*0.22);
      sg.addColorStop(0, 'rgba(255,255,255,0.82)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx - r*0.28, cy - r*0.28, r*0.22, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      // Ok: gri, hint chain boyutunda küçük dolu daire
      if (i < n - 1) {
        const lineY1 = cy + r + gap;
        const lineY2 = lineY1 + arrowH;
        const aw     = Math.max(2, Math.round(2.5 * S));

        ctx.globalAlpha = 0.45;

        // Çizgi
        ctx.beginPath();
        ctx.moveTo(cx, lineY1);
        ctx.lineTo(cx, lineY2 - aw);
        ctx.strokeStyle = 'rgba(200,200,200,0.6)';
        ctx.lineWidth   = 1.2 * S;
        ctx.stroke();

        // Ok ucu — gri dolu üçgen
        ctx.beginPath();
        ctx.moveTo(cx - aw * 1.4, lineY2 - aw * 1.2);
        ctx.lineTo(cx + aw * 1.4, lineY2 - aw * 1.2);
        ctx.lineTo(cx,             lineY2 + aw * 0.4);
        ctx.closePath();
        ctx.fillStyle  = 'rgba(200,200,200,0.65)';
        ctx.shadowBlur = 0;
        ctx.fill();
      }

      curY += r * 2 + arrowH + gap * 2;
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    ctx.restore();
  }


}