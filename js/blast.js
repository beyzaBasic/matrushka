// ── blast.js ──────────────────────────────────────────────────────
import { state } from './state.js';

export class BlastManager {
  countLevel(lv) {
    return state.circles.filter(c => c.level === lv && c.contains.length > 0).length;
  }

  getMostCommonBtn() {
    if (state.currentLevel <= 2) return null;
    let best = null, bestCount = 0;
    for (const btn of state.BLAST_BTNS) {
      const cnt = btn.levels.reduce((s, lv) => s + this.countLevel(lv), 0);
      if (cnt > bestCount || (cnt === bestCount && best && btn.levels[0] > best.levels[0])) {
        bestCount = cnt; best = btn;
      }
    }
    return bestCount > 0 ? best : null;
  }

  getBtnRect() {
    const { CX, CY, MAIN_R, BTN_PAD } = state;
    const btn = this.getMostCommonBtn();
    if (!btn) return null;
    const btnW = Math.round(MAIN_R * 0.62), btnH = Math.round(btnW * 0.42);
    const by = CY + MAIN_R + BTN_PAD, bx = CX - btnW / 2;
    return { ...btn, x: bx, y: by, w: btnW, h: btnH, cx: bx + btnW / 2, cy: by + btnH / 2 };
  }

  isEnabled(btn) {
    return btn.charges > 0 && state.circles.some(c => btn.levels.includes(c.level) && c.contains.length > 0);
  }

  fire(btn, audio) {
    if (btn.charges <= 0) return;
    const targets = state.circles.filter(c => btn.levels.includes(c.level) && c.contains.length > 0);
    if (targets.length === 0) return;
    targets.forEach((c, i) => {
      setTimeout(() => {
        if (!state.circles.find(cc => cc.id === c.id)) return;
        state.blastAnims.push({ sx: btn.cx, sy: btn.cy, tx: c.x, ty: c.y, targetId: c.id, color: btn.color, btnId: btn.id, t: 0, maxT: 20 });
      }, i * 120);
    });
    state.blastBtnAnim = { id: btn.id, t: 1.0 };
    state.blastUsedThisLevel++;
    audio.blast();
  }

  update() {
    const { blastAnims, BLAST_BTNS, circles, LEVELS, S } = state;
    for (let i = blastAnims.length - 1; i >= 0; i--) {
      const b = blastAnims[i];
      const tgt = circles.find(c => c.id === b.targetId);
      if (tgt) { b.tx = tgt.x; b.ty = tgt.y; }
      b.t++;
      if (b.t >= b.maxT) {
        if (tgt) {
          const hitBtn = BLAST_BTNS.find(bb => bb.id === b.btnId);
          if (hitBtn && hitBtn.charges > 0) hitBtn.charges--;
          this._celebrate(tgt.x, tgt.y, b.color);
          this._celebrate(tgt.x, tgt.y, '#fff');
          if (tgt.contains && tgt.contains.length > 0)
            tgt.contains.forEach(lvIdx => this._celebrate(tgt.x, tgt.y, LEVELS[lvIdx].color));
          state.circles = circles.filter(c => c.id !== b.targetId);
          state.mainBorderFlash = 25;
        }
        blastAnims.splice(i, 1);
      }
    }
    if (state.blastBtnAnim.t > 0) state.blastBtnAnim.t = Math.max(0, state.blastBtnAnim.t - 0.07);
  }

  _celebrate(x, y, color) {
    const { S } = state;
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (3 + Math.random() * 7) * S;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5 * S, r: (5 + Math.random() * 9) * S, color, life: 55 + Math.random() * 30, maxLife: 85 });
    }
  }
}
