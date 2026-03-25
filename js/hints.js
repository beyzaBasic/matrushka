// ── hints.js ──────────────────────────────────────────────────────
import { state } from './state.js';
import { TUTORIAL_LEVELS } from './constants.js';

export class HintManager {
  update(canAbsorbFn) {
    state.hintPairs = [];
    if (state.currentLevel >= TUTORIAL_LEVELS) return;
    if (state.currentLevel === 0 && (state.tut0Step < 0 || state.tut0Step >= 4)) return;
    const { circles, LEVELS } = state;
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i], b = circles[j];
        if (a.level === b.level && a.contains.length === 0 && b.contains.length === 0) {
          state.hintPairs.push({ type: 'merge', ax: a.x, ay: a.y, bx: b.x, by: b.y, ar: a.r, br: b.r, alpha: 1.0, color: LEVELS[a.level].color });
        }
        const [big, small] = a.level > b.level ? [a, b] : [b, a];
        if (canAbsorbFn(big, small)) {
          state.hintPairs.push({ type: 'absorb', ax: big.x, ay: big.y, bx: small.x, by: small.y, ar: big.r, br: small.r, alpha: 1.0, color: LEVELS[big.level].color, smallColor: LEVELS[small.level].color });
        }
      }
    }
  }

  draw() {
    const { ctx, hintPairs, currentLevel, S } = state;
    if (currentLevel >= TUTORIAL_LEVELS || hintPairs.length === 0) return;
    const t = Date.now() * 0.001;
    for (const h of hintPairs) {
      if (h.alpha < 0.02) continue;
      const dx = h.bx - h.ax, dy = h.by - h.ay;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist, ny = dy / dist;
      const pulse = 0.7 + 0.3 * Math.sin(t * 3.5);
      ctx.save(); ctx.globalAlpha = h.alpha * pulse;
      if (h.type === 'merge') {
        const midX = (h.ax + h.bx) / 2, midY = (h.ay + h.by) / 2;
        const angle = Math.atan2(dy, dx), pad = 22 * S;
        const rh = Math.max(h.ar, h.br) * 2 + pad * 2;
        const rw = Math.max(dist + Math.max(h.ar, h.br) * 2 + pad * 2, rh);
        const dashOffset = (Date.now() * 0.045) % 28;
        ctx.save(); ctx.translate(midX, midY); ctx.rotate(angle);
        ctx.setLineDash([9 * S, 5 * S]); ctx.lineDashOffset = -dashOffset;
        ctx.strokeStyle = h.color; ctx.lineWidth = 2.2 * S;
        ctx.globalAlpha = h.alpha * (0.5 + pulse * 0.4);
        ctx.shadowColor = h.color; ctx.shadowBlur = 10 * pulse;
        this._rrect(ctx, -rw / 2, -rh / 2, rw, rh, 9999); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        if (currentLevel > 0) {
          const fs = Math.round(13 * S);
          ctx.font = `bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const lw = ctx.measureText('MERGE').width + 14 * S, lh = fs + 10 * S;
          const ox = -ny * (Math.max(h.ar, h.br) + lh), oy = nx * (Math.max(h.ar, h.br) + lh);
          const lbx = midX + ox, lby = midY + oy;
          ctx.globalAlpha = h.alpha * (0.75 + pulse * 0.2); ctx.shadowBlur = 0;
          this._rrect(ctx, lbx - lw / 2, lby - lh / 2, lw, lh, lh * 0.5);
          ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.fillStyle = h.color; ctx.shadowColor = h.color; ctx.shadowBlur = 8 * pulse;
          ctx.fillText('MERGE', lbx, lby);
        }
      } else {
        const sx = h.bx, sy = h.by, bx2 = h.ax, by2 = h.ay;
        const ang = Math.atan2(by2 - sy, bx2 - sx), N = 5;
        ctx.save();
        for (let pi = 0; pi < N; pi++) {
          const phase = (t * 1.8 + pi / N * Math.PI * 2) % (Math.PI * 2);
          const prog = (Math.sin(phase - Math.PI / 2) + 1) / 2;
          const fromX = sx + Math.cos(ang) * (h.br + 4 * S), fromY = sy + Math.sin(ang) * (h.br + 4 * S);
          const toX = bx2 - Math.cos(ang) * (h.ar + 4 * S), toY = by2 - Math.sin(ang) * (h.ar + 4 * S);
          const px = fromX + (toX - fromX) * prog, py = fromY + (toY - fromY) * prog;
          const dotR = (4.5 - prog * 2.5) * S;
          ctx.globalAlpha = h.alpha * (1 - prog * 0.7) * (0.5 + 0.5 * pulse);
          ctx.beginPath(); ctx.arc(px, py, Math.max(0.5, dotR), 0, Math.PI * 2);
          ctx.fillStyle = h.smallColor; ctx.shadowColor = h.smallColor; ctx.shadowBlur = 8 * (1 - prog); ctx.fill();
        }
        ctx.restore();
        const fsA = Math.round(13 * S);
        ctx.save();
        ctx.font = `bold ${fsA}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lwA = ctx.measureText('ABSORB').width + 14 * S, lhA = fsA + 10 * S;
        const awayX = -Math.cos(ang), awayY = -Math.sin(ang);
        const lbx = sx + awayX * (h.br + lwA * 0.5 + 8 * S), lby = sy + awayY * (h.br + lhA * 0.5 + 4 * S);
        ctx.globalAlpha = h.alpha * (0.75 + pulse * 0.2); ctx.shadowBlur = 0;
        this._rrect(ctx, lbx - lwA / 2, lby - lhA / 2, lwA, lhA, lhA * 0.5);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = h.smallColor; ctx.shadowColor = h.smallColor; ctx.shadowBlur = 8 * pulse;
        ctx.fillText('ABSORB', lbx, lby); ctx.restore();
      }
      ctx.restore();
    }
  }

  drawAllChains(goalManager) {
    if (state.levelSuccess && state.levelSuccessAlpha > 0.5) return;
    const def = goalManager.getLevelDef(), n = def.goals.length;
    for (let i = 0; i < n; i++) this._drawChain(goalManager.goalSlotPos(i), def.goals[i]);
  }

  _drawChain(sp, goal) {
    const { ctx, LEVELS } = state;
    const chain = [goal.level, ...goal.contains].filter(lv => lv >= 0 && lv < LEVELS.length).reverse();
    if (chain.length === 0) return;
    const n = chain.length, R_BIG = 14, R_SMALL = 6, ARROW = 7, GAP = 3;
    const radii = chain.map((_, i) => n === 1 ? R_BIG : Math.round(R_SMALL + (R_BIG - R_SMALL) * i / (n - 1)));
    const totalW = radii.reduce((s, r) => s + r * 2, 0) + (n - 1) * (GAP * 2 + ARROW);
    const maxW = sp.gemR * 2, sc = totalW > maxW ? maxW / totalW : 1;
    const rr = radii.map(r => Math.max(3, Math.round(r * sc)));
    const aw = Math.max(4, Math.round(ARROW * sc)), gw = Math.max(2, Math.round(GAP * sc));
    const midY = sp.cy + sp.gemR + 10 + rr[n - 1];
    const tw2 = rr.reduce((s, r) => s + r * 2, 0) + (n - 1) * (gw * 2 + aw);
    let curX = sp.cx - tw2 / 2;
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.001 * 2.2);
    for (let i = 0; i < n; i++) {
      const lv = chain[i], r = rr[i], col = LEVELS[lv].color, cx2 = curX + r;
      ctx.save(); ctx.globalAlpha = 0.85 + 0.15 * pulse;
      ctx.beginPath(); ctx.arc(cx2, midY, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.restore(); curX += r * 2;
      if (i < n - 1) {
        curX += gw;
        const ax1 = curX, ax2 = curX + aw, ah = Math.max(2, Math.round(aw * 0.5));
        ctx.save(); ctx.globalAlpha = 0.5 + 0.2 * pulse;
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = Math.max(1, aw * 0.2);
        ctx.beginPath(); ctx.moveTo(ax1, midY); ctx.lineTo(ax2 - ah, midY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax2, midY); ctx.lineTo(ax2 - ah, midY - ah); ctx.lineTo(ax2 - ah, midY + ah); ctx.closePath(); ctx.fill();
        ctx.restore(); curX += aw + gw;
      }
    }
  }

  _rrect(ctx, x, y, w, h, r) {
    r = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
}
