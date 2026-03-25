// ── tutorial.js ───────────────────────────────────────────────────
import { state } from './state.js';

export class TutorialManager {

  makeCircle(lv, x, y) {
    const { LEVELS } = state;
    return {
      id: 'tut_' + Math.random(), x, y,
      r: LEVELS[lv].r, level: lv, color: LEVELS[lv].color,
      vx: 0, vy: LEVELS[lv].vy, contains: [],
      absorbAnim: 0, isBeingDragged: false, boing: 0, absorbGlow: 0
    };
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

  // Topu düşür, settle edince (vy<0.8) cb çağır
  _drop(circle, cb) {
    state.circles.push(circle);
    if (state.audio) state.audio.spawn();
    const iv = setInterval(() => {
      const c = state.circles.find(x => x.id === circle.id);
      if (!c || Math.abs(c.vy) < 0.8) {
        clearInterval(iv);
        setTimeout(cb, 300);
      }
    }, 50);
  }

  // Sahnede belirli bir koşul gerçekleşene kadar bekle, sonra cb
  _waitUntil(condFn, cb, interval = 100) {
    const iv = setInterval(() => {
      if (condFn()) { clearInterval(iv); cb(); }
    }, interval);
  }

  spawnStep() {
    const { CX, CY, MAIN_R } = state;
    state.introDropsDone = true;

    if (state.tut0Step === 0) {
      // 1. pembe düş, settle et, 2. pembeyi düşür
      state.circles = [];
      setTimeout(() => {
        this._drop(
          this.makeCircle(0, CX - MAIN_R * 0.38, CY - MAIN_R * 0.72),
          () => {
            if (state.tut0Step !== 0) return;
            const c0 = this.makeCircle(0, CX + MAIN_R * 0.15, CY - MAIN_R * 0.72); state.circles.push(c0); if (state.audio) state.audio.spawn();
          }
        );
      }, 400);

    } else if (state.tut0Step === 1) {
      // Sahnede 1 sarı var (step0'dan geldi).
      // Settle edince 2. sarıyı düşür.
      // Merge olmadan 3. çıkmaz: flag ile engelle.
      state._tut1done = false;
      this._waitUntil(
        () => {
          const ys = state.circles.filter(c => c.level === 1 && c.contains.length === 0);
          return ys.length === 1 && Math.abs(ys[0].vy) < 0.8;
        },
        () => {
          if (state.tut0Step !== 1 || state._tut1done) return;
          state._tut1done = true;
          const pos = this.safePos(1);
          const c2 = this.makeCircle(1, pos.x, CY - MAIN_R * 0.72); state.circles.push(c2); if (state.audio) state.audio.spawn();
        }
      );

    } else if (state.tut0Step === 2) {
      // Sahnede turuncu var (step1'den geldi).
      // Settle edince sarı düşür.
      this._waitUntil(
        () => {
          const o = state.circles.find(c => c.level === 2 && c.contains.length === 0);
          return o && Math.abs(o.vy) < 0.8;
        },
        () => {
          if (state.tut0Step !== 2) return;
          const pos = this.safePos(1);
          const c2 = this.makeCircle(1, pos.x, CY - MAIN_R * 0.72); state.circles.push(c2); if (state.audio) state.audio.spawn();
        }
      );

    } else if (state.tut0Step === 3) {
      // 1. turuncu düş, settle et, 2. turuncuyu düşür
      this._drop(
        this.makeCircle(2, CX - MAIN_R * 0.30, CY - MAIN_R * 0.72),
        () => {
          if (state.tut0Step !== 3) return;
          const c3 = this.makeCircle(2, CX + MAIN_R * 0.10, CY - MAIN_R * 0.72); state.circles.push(c3); if (state.audio) state.audio.spawn();
        }
      );
    }
  }

  update() {
    if (state.currentLevel !== 0 || state.tut0Step < 0 ||
        state.tut0Step >= 4 || state.tut0Transitioning) return;

    const advance = (next) => {
      if (state.tut0Transitioning) return;
      state.tut0Transitioning = true;
      setTimeout(() => {
        state.tut0Step = next;
        this.spawnStep();
        state.tut0Transitioning = false;
      }, 600);
    };

    const cs = state.circles;

    if (state.tut0Step === 0) {
      // 2 pembe merge → sarı (lv1) çıktı
      if (cs.find(c => c.level === 1 && c.contains.length === 0)) advance(1);

    } else if (state.tut0Step === 1) {
      // 2. sarı düşürüldü VE 2 sarı merge → turuncu (lv2) çıktı VE sarı kalmadı
      const hasOrange = cs.find(c => c.level === 2 && c.contains.length === 0);
      const noYellow  = !cs.find(c => c.level === 1);
      if (state._tut1done && hasOrange && noYellow) advance(2);

    } else if (state.tut0Step === 2) {
      // Turuncu sarıyı absorb etti
      if (cs.find(c => c.level === 2 && c.contains.includes(1))) advance(3);

    } else if (state.tut0Step === 3) {
      // 2 turuncu merge → yeşil (lv3) çıktı
      if (cs.find(c => c.level === 3 && c.contains.length === 0)) state.tut0Step = 4;
    }
  }

  drawHint() {
    const { ctx, circles, currentLevel, tut0Step, tut0Transitioning,
            CX, CY, MAIN_R, S, LEVELS } = state;
    if (currentLevel !== 0 || tut0Step < 0 || tut0Step >= 4 || tut0Transitioning) return;

    const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.004);
    const fs = Math.round(14 * S);
    let ballA = null, ballB = null, msg = '';

    if (tut0Step === 0) {
      const p = circles.filter(c => c.level === 0 && c.contains.length === 0);
      if (p.length < 2) return;
      [ballA, ballB] = p; msg = 'MERGE';
    } else if (tut0Step === 1) {
      const y = circles.filter(c => c.level === 1 && c.contains.length === 0);
      if (y.length < 2) return;
      [ballA, ballB] = y; msg = 'MERGE';
    } else if (tut0Step === 2) {
      ballA = circles.find(c => c.level === 2 && c.contains.length === 0);
      ballB = circles.find(c => c.level === 1 && c.contains.length === 0);
      if (!ballA || !ballB) return; msg = 'ABSORB';
    } else if (tut0Step === 3) {
      const o = circles.filter(c => c.level === 2 && c.contains.length === 0);
      if (o.length < 2) return;
      [ballA, ballB] = o; msg = 'MERGE';
    }
    if (!ballA || !ballB) return;

    const midX = (ballA.x + ballB.x) / 2, midY = (ballA.y + ballB.y) / 2;
    const dx = ballB.x - ballA.x, dy = ballB.y - ballA.y;
    const dist = Math.hypot(dx, dy) || 1, angle = Math.atan2(dy, dx);
    const pad = 22 * S;
    const rh = Math.max(ballA.r, ballB.r) * 2 + pad * 2;
    const rw = Math.max(dist + Math.max(ballA.r, ballB.r) * 2 + pad * 2, rh);
    const col = msg === 'MERGE' ? LEVELS[ballA.level].color : '#FFD700';
    const dash = (Date.now() * 0.045) % 28;

    if (msg !== 'ABSORB') {
      ctx.save(); ctx.translate(midX, midY); ctx.rotate(angle);
      ctx.setLineDash([9 * S, 5 * S]); ctx.lineDashOffset = -dash;
      ctx.strokeStyle = col; ctx.lineWidth = 2.2 * S;
      ctx.globalAlpha = 0.5 + pulse * 0.4;
      ctx.shadowColor = col; ctx.shadowBlur = 10 * pulse;
      this._rrect(ctx, -rw/2, -rh/2, rw, rh, 9999); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.12 + pulse * 0.1; ctx.lineWidth = S; ctx.shadowBlur = 0;
      this._rrect(ctx, -rw*0.45, -rh*0.45, rw*0.9, rh*0.9, 9999); ctx.stroke();
      ctx.restore();

      const px = -dy/dist, py = dx/dist, ld = rh/2 + 14*S;
      let lx = midX + px*ld, ly = midY + py*ld;
      if (Math.hypot(lx-CX, ly-CY) > MAIN_R*0.85) { lx = midX-px*ld; ly = midY-py*ld; }
      ctx.save();
      ctx.font = `bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const pw = ctx.measureText(msg).width + 18*S, ph = fs + 12*S;
      ctx.globalAlpha = 0.75 + pulse*0.2;
      this._rrect(ctx, lx-pw/2, ly-ph/2, pw, ph, ph*0.5);
      ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.shadowBlur = 0; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 7*pulse;
      ctx.fillText(msg, lx, ly); ctx.restore();
    }
  }

  _rrect(ctx, x, y, w, h, r) {
    r = Math.min(Math.abs(r), Math.abs(w)/2, Math.abs(h)/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r); ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
  }
}
