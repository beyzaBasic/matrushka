// ── tutorial.js ───────────────────────────────────────────────────
import { state } from './state.js';

export class TutorialManager {
  makeCircle(lv, x, y) {
    const { LEVELS } = state;
    return { id: 'tut0_' + Math.random(), x, y, r: LEVELS[lv].r, level: lv,
      color: LEVELS[lv].color, vx: 0, vy: LEVELS[lv].vy, contains: [], absorbAnim: 0,
      isBeingDragged: false, boing: 0, absorbGlow: 0 };
  }

  safePos(lv) {
    const { circles, CX, CY, MAIN_R, LEVELS } = state;
    const minDist = LEVELS[lv].r * 3.5;
    const slots = [
      { x: CX - MAIN_R * 0.52, y: CY - MAIN_R * 0.38 },
      { x: CX + MAIN_R * 0.52, y: CY - MAIN_R * 0.38 },
      { x: CX - MAIN_R * 0.52, y: CY + MAIN_R * 0.38 },
      { x: CX + MAIN_R * 0.52, y: CY + MAIN_R * 0.38 },
      { x: CX,                  y: CY - MAIN_R * 0.60 },
      { x: CX - MAIN_R * 0.28, y: CY + MAIN_R * 0.52 },
      { x: CX + MAIN_R * 0.28, y: CY + MAIN_R * 0.52 },
      { x: CX - MAIN_R * 0.70, y: CY },
      { x: CX + MAIN_R * 0.70, y: CY },
    ];
    for (const p of slots) {
      if (Math.hypot(p.x - CX, p.y - CY) > MAIN_R - LEVELS[lv].r - 4) continue;
      if (circles.every(c => Math.hypot(p.x - c.x, p.y - c.y) > minDist + c.r)) return p;
    }
    return { x: CX + (Math.random() - 0.5) * MAIN_R * 0.3, y: CY - MAIN_R * 0.55 };
  }

  spawnStep() {
    const { CX, CY, MAIN_R } = state;
    state.introDropsDone = true;

    if (state.tut0Step === 0) {
      state.circles = [];
      setTimeout(() => state.circles.push(this.makeCircle(0, CX - MAIN_R * 0.38, CY - MAIN_R * 0.72)), 400);
      setTimeout(() => state.circles.push(this.makeCircle(0, CX + MAIN_R * 0.15, CY - MAIN_R * 0.72)), 1100);
    } else if (state.tut0Step === 1) {
      // Sahnede 1 turuncu varken ikincisini düşür — merge olmadan üçüncü çıkmasın
      const dropSecondOrange = () => {
        if (state.tut0Step !== 1) return;
        const oranges = state.circles.filter(c => c.level === 1 && c.contains.length === 0);
        if (oranges.length !== 1) {
          setTimeout(dropSecondOrange, 300);
        } else {
          const pos = this.safePos(1);
          state.circles.push(this.makeCircle(1, pos.x, CY - MAIN_R * 0.72));
        }
      };
      setTimeout(dropSecondOrange, 700);
    } else if (state.tut0Step === 2) {
      // Sahnede turuncu (lv 1) kalmayınca yeni turuncu düşür
      // step 1'deki iki turuncu merge olup sarıya dönmüş olmalı
      const dropOrange = () => {
        if (state.tut0Step !== 2) return;
        const hasOrange = state.circles.some(c => c.level === 1);
        if (hasOrange) {
          setTimeout(dropOrange, 300);
        } else {
          const pos = this.safePos(1);
          state.circles.push(this.makeCircle(1, pos.x, CY - MAIN_R * 0.72));
        }
      };
      setTimeout(dropOrange, 700);
    } else if (state.tut0Step === 3) {
      setTimeout(() => state.circles.push(this.makeCircle(2, CX - MAIN_R * 0.30, CY - MAIN_R * 0.72)), 500);
      setTimeout(() => state.circles.push(this.makeCircle(2, CX + MAIN_R * 0.10, CY - MAIN_R * 0.72)), 1400);
    }
  }

  update() {
    if (state.currentLevel !== 0 || state.tut0Step < 0 || state.tut0Step >= 4 || state.tut0Transitioning) return;
    const advance = (nextStep) => {
      if (state.tut0Transitioning) return;
      state.tut0Transitioning = true;
      setTimeout(() => { state.tut0Step = nextStep; this.spawnStep(); state.tut0Transitioning = false; }, 600);
    };
    const { circles } = state;
    if (state.tut0Step === 0) { if (circles.find(c => c.level === 1 && c.contains.length === 0)) advance(1); }
    else if (state.tut0Step === 1) { if (circles.find(c => c.level === 2 && c.contains.length === 0) && !circles.find(c => c.level === 1)) advance(2); }
    else if (state.tut0Step === 2) { if (circles.find(c => c.level === 2 && c.contains.includes(1))) advance(3); }
    else if (state.tut0Step === 3) { if (circles.find(c => c.level === 3 && c.contains.length === 0)) state.tut0Step = 4; }
  }

  drawHint() {
    const { ctx, circles, currentLevel, tut0Step, tut0Transitioning, CX, CY, MAIN_R, S, LEVELS } = state;
    if (currentLevel !== 0 || tut0Step < 0 || tut0Step >= 4 || tut0Transitioning) return;

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
    const fs = Math.round(14 * S);
    let ballA = null, ballB = null, msg = '';

    if (tut0Step === 0) {
      const pinks = circles.filter(c => c.level === 0 && c.contains.length === 0);
      if (pinks.length < 2) return;
      [ballA, ballB] = pinks; msg = 'MERGE';
    } else if (tut0Step === 1) {
      const oranges = circles.filter(c => c.level === 1 && c.contains.length === 0);
      if (oranges.length < 2) return;
      [ballA, ballB] = oranges; msg = 'MERGE';
    } else if (tut0Step === 2) {
      ballA = circles.find(c => c.level === 2 && c.contains.length === 0);
      ballB = circles.find(c => c.level === 1 && c.contains.length === 0);
      if (!ballA || !ballB) return; msg = 'ABSORB';
    } else if (tut0Step === 3) {
      const yellows = circles.filter(c => c.level === 2 && c.contains.length === 0);
      if (yellows.length < 2) return;
      [ballA, ballB] = yellows; msg = 'MERGE';
    }
    if (!ballA || !ballB) return;

    const midX = (ballA.x + ballB.x) / 2, midY = (ballA.y + ballB.y) / 2;
    const dx = ballB.x - ballA.x, dy = ballB.y - ballA.y;
    const dist = Math.hypot(dx, dy) || 1, angle = Math.atan2(dy, dx);
    const pad = 22 * S;
    const rh = Math.max(ballA.r, ballB.r) * 2 + pad * 2;
    const rw = Math.max(dist + Math.max(ballA.r, ballB.r) * 2 + pad * 2, rh);
    const corner = 9999;
    const shapeColor = msg === 'MERGE' ? LEVELS[ballA.level].color : '#FFD700';
    const dashOffset = (Date.now() * 0.045) % 28;

    if (msg !== 'ABSORB') {
      ctx.save(); ctx.translate(midX, midY); ctx.rotate(angle);
      ctx.setLineDash([9 * S, 5 * S]); ctx.lineDashOffset = -dashOffset;
      ctx.strokeStyle = shapeColor; ctx.lineWidth = 2.2 * S;
      ctx.globalAlpha = 0.5 + pulse * 0.4; ctx.shadowColor = shapeColor; ctx.shadowBlur = 10 * pulse;
      this._rrect(ctx, -rw / 2, -rh / 2, rw, rh, corner); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.12 + pulse * 0.1; ctx.lineWidth = 1 * S; ctx.shadowBlur = 0;
      this._rrect(ctx, -rw / 2 * 0.9, -rh / 2 * 0.9, rw * 0.9, rh * 0.9, corner * 0.9); ctx.stroke();
      ctx.restore();
    }
    if (msg !== 'ABSORB') {
      const perpX = -dy / dist, perpY = dx / dist;
      const labelDist = rh / 2 + 14 * S;
      let lx = midX + perpX * labelDist, ly = midY + perpY * labelDist;
      if (Math.hypot(lx - CX, ly - CY) > MAIN_R * 0.85) { lx = midX - perpX * labelDist; ly = midY - perpY * labelDist; }
      ctx.save();
      ctx.font = `bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(msg).width, pw = tw + 18 * S, ph = fs + 12 * S;
      ctx.globalAlpha = 0.75 + pulse * 0.2;
      this._rrect(ctx, lx - pw / 2, ly - ph / 2, pw, ph, ph * 0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.shadowBlur = 0; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = shapeColor; ctx.shadowColor = shapeColor; ctx.shadowBlur = 7 * pulse;
      ctx.fillText(msg, lx, ly); ctx.restore();
    }
  }

  _rrect(ctx, x, y, w, h, r) {
    r = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
