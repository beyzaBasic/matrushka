import { state } from './state.js';

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function spawnBall(lv, xOff = 0) {
  const { CX, CY, MAIN_R, LEVELS } = state;
  const r = LEVELS[lv].r, sx = CX + xOff, dx = sx - CX;
  const sy = CY - Math.sqrt(Math.max(0, (MAIN_R - r - 4) ** 2 - dx * dx));
  return {
    id: Math.random(), x: sx, y: sy, r, level: lv,
    color: LEVELS[lv].color, vx: 0, vy: LEVELS[lv].vy ?? 4,
    contains: [], absorbAnim: 0, isBeingDragged: false, boing: 0, absorbGlow: 0,
  };
}

function settled(b) { return b && Math.abs(b.vy) < 2.5; }

// Tutorial için sabit 3 slot: lv2, lv1, lv0
const TUT_GOALS = [{ level: 2, contains: [1, 0] }];

// ── TutorialManager ───────────────────────────────────────────────────────────
export class TutorialManager {

  constructor() {
    this._step  = -1;
    this._phase = '';
    this._timer = 0;
    this._showHint = false; // iki top görününce true olur
    // Ok animasyonu: { sx, sy, tx, ty } — küçükten büyüğe
    this._arrow = null;
  }

  // ── Dışarıdan çağrılan API ───────────────────────────────────────────────

  startStep(n, initialPhase = 'INIT') {
    this._step     = n;
    this._phase    = initialPhase;
    this._timer    = 0;
    this._showHint  = false;
    this._hintAlpha = 0;
    this._arrow     = null;
    this._popupT    = undefined;   // popup animasyon state reset
    this._confetti  = null;
    this._cardSparkles = null;
    state.nextBall         = null;
    state.heldBall         = null;
    state._nextBallBlocked = false;
    state.tutShowPopup     = false;
    state.tutStep          = n;
    // Tutorial slotlarını her adımda sıfırla
    this._initSlots();
  }

  _initSlots() {
    state.goalSlots  = TUT_GOALS.map(() => null);
    state.flyingGoals = [];
  }

  // ── Update (her frame) ───────────────────────────────────────────────────

  update() {
    if (!state.isTutorial || state.tutDone) return;
    this._timer++;
    if      (this._step === 0) this._s0();
    else if (this._step === 1) this._s1();
    else if (this._step === 2) this._s2();
    else if (this._step === 3) this._s3();
  }

  // ── Draw (game.js draw'dan çağrılır) ────────────────────────────────────

  drawHint() {
    // Her zaman çalışır — guard'lar kaldırıldı, her frame çizer
    if (state.tutDone) return;
    if (this._step === 3) return;
    // _showHint beklenmeden phase'e göre direkt göster
    const label = this._label();
    // hintAlpha animasyonu
    if (this._showHint && this._hintAlpha < 1) {
      this._hintAlpha = Math.min(1, this._hintAlpha + 0.08);
    }
    if (!this._showHint) return;
    if (label) this._drawLabel(label);
    if (this._arrow) this._drawArrow();
  }

  // "How to Play" popup — hypercasual stil: scale-in, animated demo, confetti, pulse CTA
  drawPopup() {
    if (!state.tutShowPopup) return;

    // İlk frame: animasyon state'i başlat
    if (this._popupT === undefined) {
      this._popupT = 0;
      this._confetti = this._makeConfetti();
    }
    this._popupT++;

    const ctx = state.ctx;
    const { W, H, CX, CY, S, isDarkMode, LEVELS } = state;
    const t = this._popupT;
    const font = `"ui-rounded","Arial Rounded MT Bold",sans-serif`;

    // ── Dimmed backdrop with vignette ─────────────────────────────────
    const dimAlpha = Math.min(0.78, t * 0.04);
    ctx.fillStyle = `rgba(0,0,0,${dimAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // ── Confetti behind card ──────────────────────────────────────────
    this._drawConfetti(t);

    // ── Card scale-in animation (elastic ease-out) ────────────────────
    const ep = Math.min(1, t / 22);
    const elastic = ep < 1
      ? 1 + Math.pow(2, -10 * ep) * Math.sin((ep - 0.075) * (2 * Math.PI / 0.3))
      : 1;
    const cardScale = ep < 1 ? elastic : 1;

    // Card boyutu
    const cw = Math.min(W * 0.88, 340 * S);
    const ch = 380 * S;
    const cx = CX - cw / 2;
    const cy = CY - ch / 2;

    ctx.save();
    ctx.translate(CX, CY);
    ctx.scale(cardScale, cardScale);
    ctx.translate(-CX, -CY);

    // ── Card glow (behind card) ───────────────────────────────────────
    const glowPulse = 0.6 + 0.4 * Math.sin(t / 18);
    ctx.save();
    ctx.shadowColor = `rgba(91, 76, 255, ${0.5 * glowPulse})`;
    ctx.shadowBlur = 40 * S;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.beginPath(); this._rr(ctx, cx, cy, cw, ch, 28 * S);
    ctx.fill();
    ctx.restore();

    // ── Card body — vertical gradient ─────────────────────────────────
    const grad = ctx.createLinearGradient(0, cy, 0, cy + ch);
    if (isDarkMode) {
      grad.addColorStop(0, '#2a1f5c');
      grad.addColorStop(1, '#15102e');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f0ebff');
    }
    ctx.beginPath(); this._rr(ctx, cx, cy, cw, ch, 28 * S);
    ctx.fillStyle = grad; ctx.fill();

    // İnce kenarlık — soft purple
    ctx.strokeStyle = isDarkMode ? 'rgba(180,160,255,0.25)' : 'rgba(91,76,255,0.18)';
    ctx.lineWidth = 2 * S;
    ctx.stroke();

    // ── Floating sparkles inside card (decorative) ────────────────────
    this._drawCardSparkles(cx, cy, cw, ch, t);

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // ── Header: "Ready to Play?" — bouncy ─────────────────────────────
    const headerBounce = Math.sin(t / 22) * 2 * S;
    ctx.font = `900 ${Math.round(26 * S)}px ${font}`;
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillText('Ready to Play?', CX, cy + 44 * S + headerBounce + 2 * S);
    // Main text — gradient
    const headerGrad = ctx.createLinearGradient(0, cy + 30 * S, 0, cy + 60 * S);
    headerGrad.addColorStop(0, '#FFD93D');
    headerGrad.addColorStop(1, '#FF9F1C');
    ctx.fillStyle = headerGrad;
    ctx.fillText('Ready to Play?', CX, cy + 44 * S + headerBounce);

    // Subtitle
    ctx.font = `600 ${Math.round(13 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.5)';
    ctx.fillText("You've got the moves!", CX, cy + 72 * S);

    // ── Animated demo row — Merge & Absorb mini demo ──────────────────
    this._drawDemoRow(cx, cy + 100 * S, cw, t);

    // ── Goal explainer ────────────────────────────────────────────────
    const goalY = cy + 252 * S;
    ctx.font = `700 ${Math.round(15 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? '#fff' : '#222';
    ctx.fillText('🎯 Fill the slot to win!', CX, goalY);

    ctx.font = `500 ${Math.round(11 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
    ctx.fillText('Match the goal shape at the top', CX, goalY + 18 * S);

    // ── CTA Button — pulsing, gradient, with shadow ───────────────────
    const btnPulse = 1 + Math.sin(t / 9) * 0.035;
    const bw = cw * 0.78;
    const bh = 54 * S;
    const bx = CX - bw / 2;
    const by = cy + ch - 76 * S;
    const bcx = CX, bcy = by + bh / 2;

    ctx.save();
    ctx.translate(bcx, bcy);
    ctx.scale(btnPulse, btnPulse);
    ctx.translate(-bcx, -bcy);

    // Button shadow
    ctx.fillStyle = 'rgba(91, 76, 255, 0.55)';
    ctx.beginPath(); this._rr(ctx, bx, by + 5 * S, bw, bh, bh * 0.45);
    ctx.fill();

    // Button body — gradient
    const btnGrad = ctx.createLinearGradient(0, by, 0, by + bh);
    btnGrad.addColorStop(0, '#7B6CFF');
    btnGrad.addColorStop(1, '#5B4CFF');
    ctx.beginPath(); this._rr(ctx, bx, by, bw, bh, bh * 0.45);
    ctx.fillStyle = btnGrad; ctx.fill();

    // Button shine — top highlight
    ctx.beginPath(); this._rr(ctx, bx + 8 * S, by + 4 * S, bw - 16 * S, bh * 0.45, bh * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.fill();

    // Button text
    ctx.font = `900 ${Math.round(18 * S)}px ${font}`;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillText("Let's Play!", CX, bcy + 2 * S);
    ctx.fillStyle = '#fff';
    ctx.fillText("Let's Play!", CX, bcy);

    // Sparkle on button
    const sparkX = bx + bw * (0.15 + (Math.sin(t / 30) * 0.5 + 0.5) * 0.7);
    const sparkSize = (2 + Math.sin(t / 7) * 1.5) * S;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t / 7) * 0.4})`;
    this._drawSparkle(ctx, sparkX, by + bh * 0.35, sparkSize);

    ctx.restore();

    // Hit area — pulse-aware ama base rect
    state._tutPopupBtn = { x: bx, y: by, w: bw, h: bh };

    ctx.restore();
  }

  // ── Confetti ──────────────────────────────────────────────────────────────

  _makeConfetti() {
    const { W, H, LEVELS } = state;
    const colors = (LEVELS || []).map(l => l.color).filter(Boolean);
    const palette = colors.length ? colors : ['#FFD93D', '#FF6B9D', '#5B4CFF', '#2ED573', '#FF9F1C'];
    const arr = [];
    for (let i = 0; i < 36; i++) {
      arr.push({
        x: Math.random() * W,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.5 + Math.random() * 2.5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.2,
        size: 5 + Math.random() * 6,
        color: palette[Math.floor(Math.random() * palette.length)],
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
      });
    }
    return arr;
  }

  _drawConfetti(t) {
    if (!this._confetti) return;
    const ctx = state.ctx;
    const { H, W, S } = state;
    ctx.save();
    for (const p of this._confetti) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      if (p.shape === 'rect') {
        const w = p.size * S, h = p.size * 0.5 * S;
        ctx.fillRect(-w/2, -h/2, w, h);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.4 * S, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  _drawCardSparkles(cx, cy, cw, ch, t) {
    const ctx = state.ctx;
    const { S } = state;
    if (!this._cardSparkles) {
      this._cardSparkles = [];
      for (let i = 0; i < 8; i++) {
        this._cardSparkles.push({
          rx: 0.1 + Math.random() * 0.8,
          ry: 0.1 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          size: 1.5 + Math.random() * 2,
        });
      }
    }
    ctx.save();
    for (const s of this._cardSparkles) {
      const px = cx + s.rx * cw;
      const py = cy + s.ry * ch;
      const alpha = (Math.sin(t / 20 + s.phase) * 0.5 + 0.5) * 0.6;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this._drawSparkle(ctx, px, py, s.size * S);
    }
    ctx.restore();
  }

  _drawSparkle(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2);
    ctx.lineTo(x + r * 0.4, y - r * 0.4);
    ctx.lineTo(x + r * 2, y);
    ctx.lineTo(x + r * 0.4, y + r * 0.4);
    ctx.lineTo(x, y + r * 2);
    ctx.lineTo(x - r * 0.4, y + r * 0.4);
    ctx.lineTo(x - r * 2, y);
    ctx.lineTo(x - r * 0.4, y - r * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // ── Animated demo row — Merge ve Absorb mini animasyonu ──────────────────

  _drawDemoRow(cx, cy, cw, t) {
    const ctx = state.ctx;
    const { S, isDarkMode, LEVELS } = state;
    const font = `"ui-rounded","Arial Rounded MT Bold",sans-serif`;

    // 2 sütun: Merge | Absorb
    const colW = cw / 2;
    const merge_cx = cx + colW * 0.5;
    const absorb_cx = cx + colW * 1.5;
    const demoH = 130 * S;
    const cycleT = 90; // her loop 90 frame

    // Renkler — LEVELS varsa kullan
    const c0 = LEVELS?.[0]?.color || '#FF6B9D';
    const c1 = LEVELS?.[1]?.color || '#FFD93D';
    const c2 = LEVELS?.[2]?.color || '#5B4CFF';

    // Ortak: divider çizgi
    ctx.save();
    ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1 * S;
    ctx.beginPath();
    ctx.moveTo(cx + colW, cy + 10 * S);
    ctx.lineTo(cx + colW, cy + demoH - 10 * S);
    ctx.stroke();
    ctx.restore();

    // ── MERGE animation ──────────────────────────────────────────────
    const phase = (t % cycleT) / cycleT; // 0..1
    const ballR = 14 * S;
    const spread = 22 * S;
    const animY = cy + 50 * S;

    // 0.0-0.4: iki top yan yana yaklaşıyor
    // 0.4-0.6: birleşiyor
    // 0.6-1.0: tek büyük top + glow
    let leftX, rightX, merged = false, mergeScale = 1;
    if (phase < 0.4) {
      const p = phase / 0.4;
      leftX  = merge_cx - spread - (1 - p) * 15 * S;
      rightX = merge_cx + spread + (1 - p) * 15 * S;
    } else if (phase < 0.55) {
      leftX = merge_cx - spread * (1 - (phase - 0.4) / 0.15);
      rightX = merge_cx + spread * (1 - (phase - 0.4) / 0.15);
    } else {
      merged = true;
      const p = (phase - 0.55) / 0.45;
      mergeScale = 1 + Math.sin(p * Math.PI) * 0.25;
    }

    ctx.save();
    if (!merged) {
      // İki lv0 top
      this._drawDemoBall(ctx, leftX, animY, ballR, c0);
      this._drawDemoBall(ctx, rightX, animY, ballR, c0);
      // Yaklaşma çizgisi (faint)
      if (phase < 0.4) {
        ctx.strokeStyle = `rgba(255,255,255,${0.2 + phase * 0.5})`;
        ctx.lineWidth = 1.5 * S;
        ctx.setLineDash([3 * S, 3 * S]);
        ctx.beginPath();
        ctx.moveTo(leftX + ballR, animY);
        ctx.lineTo(rightX - ballR, animY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      // Merged: lv1 top + sparkle ring
      const r = ballR * 1.4 * mergeScale;
      // Ring
      const ringAlpha = Math.max(0, 1 - (phase - 0.55) / 0.3);
      if (ringAlpha > 0) {
        ctx.strokeStyle = `rgba(255, 217, 61, ${ringAlpha})`;
        ctx.lineWidth = 2 * S;
        ctx.beginPath();
        ctx.arc(merge_cx, animY, r + (1 - ringAlpha) * 18 * S, 0, Math.PI * 2);
        ctx.stroke();
      }
      this._drawDemoBall(ctx, merge_cx, animY, r, c1);
    }
    ctx.restore();

    // Merge label
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(12 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? '#fff' : '#222';
    ctx.fillText('MERGE', merge_cx, cy + 96 * S);
    ctx.font = `500 ${Math.round(9.5 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    ctx.fillText('same + same', merge_cx, cy + 113 * S);

    // ── ABSORB animation ─────────────────────────────────────────────
    // Büyük top sabit, küçük top yaklaşıp içine giriyor
    const bigR = 22 * S;
    let smallX, smallScale = 1, smallAlpha = 1;
    if (phase < 0.45) {
      const p = phase / 0.45;
      smallX = absorb_cx - 32 * S + p * 22 * S;
    } else if (phase < 0.65) {
      const p = (phase - 0.45) / 0.20;
      smallX = absorb_cx - 10 * S + p * 10 * S;
      smallScale = 1 - p * 0.6;
      smallAlpha = 1 - p * 0.8;
    } else {
      smallX = absorb_cx;
      smallScale = 0;
      smallAlpha = 0;
    }

    ctx.save();
    // Büyük top
    const bigPulse = phase > 0.45 && phase < 0.75 ? 1 + Math.sin((phase - 0.45) / 0.3 * Math.PI) * 0.12 : 1;
    this._drawDemoBall(ctx, absorb_cx, animY, bigR * bigPulse, c2);
    // İç halka (nested görünüm) — absorb tamamlanınca
    if (phase > 0.65) {
      const innerAlpha = Math.min(1, (phase - 0.65) / 0.15);
      ctx.fillStyle = `rgba(255,255,255,${innerAlpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(absorb_cx, animY, bigR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c0;
      ctx.globalAlpha = innerAlpha;
      ctx.beginPath();
      ctx.arc(absorb_cx, animY, bigR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Küçük top (yaklaşan)
    if (smallAlpha > 0) {
      ctx.globalAlpha = smallAlpha;
      this._drawDemoBall(ctx, smallX, animY, ballR * smallScale, c0);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Absorb label
    ctx.font = `800 ${Math.round(12 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? '#fff' : '#222';
    ctx.fillText('ABSORB', absorb_cx, cy + 96 * S);
    ctx.font = `500 ${Math.round(9.5 * S)}px ${font}`;
    ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    ctx.fillText('big eats small', absorb_cx, cy + 113 * S);
  }

  _drawDemoBall(ctx, x, y, r, color) {
    // Body
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // Highlight
    const hl = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x - r * 0.3, y - r * 0.35, r * 0.7);
    hl.addColorStop(0, 'rgba(255,255,255,0.55)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    // Rim
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }

  // ── Step 0: lv0 + lv0 → merge ───────────────────────────────────────────

  _s0() {
    const xOff = (state.MAIN_R ?? 160) * 0.28;

    if (this._phase === 'INIT' && this._timer > 5) {
      state.circles.push(spawnBall(0, -xOff));
      this._phase = 'DROP1'; this._timer = 0;
    }

    // İkinci top kısa süre sonra — ard arda
    if (this._phase === 'DROP1' && this._timer > 28) {
      state.circles.push(spawnBall(0, +xOff));
      this._phase = 'WAIT_SETTLE'; this._timer = 0;
    }

    // Her ikisi duraksayınca hint + ok göster
    if (this._phase === 'WAIT_SETTLE') {
      const bs = state.circles.filter(c => c.level === 0);
      if (bs.length >= 2 && (bs.every(settled) || this._timer > 90) && this._timer > 15) {
        const right = bs.reduce((a, b) => a.x > b.x ? a : b);
        const left  = bs.reduce((a, b) => a.x < b.x ? a : b);
        this._showHint  = true;
        this._hintAlpha = 0; // pop animasyonu başlat
        this._arrow = { sx: right.x, sy: right.y, tx: left.x, ty: left.y };
        this._phase = 'WAIT_MERGE'; this._timer = 0;
      }
    }

    if (this._phase === 'WAIT_MERGE') {
      // Ok pozisyonunu canlı tut
      const bs = state.circles.filter(c => c.level === 0);
      if (bs.length >= 2 && this._arrow) {
        const right = bs.reduce((a, b) => a.x > b.x ? a : b);
        const left  = bs.reduce((a, b) => a.x < b.x ? a : b);
        this._arrow.sx = right.x; this._arrow.sy = right.y;
        this._arrow.tx = left.x;  this._arrow.ty = left.y;
      }
      if (state.circles.some(c => c.level === 1)) {
        this._showHint = false; this._arrow = null;
        this._phase = 'MERGED'; this._timer = 0;
      }
    }

    if (this._phase === 'MERGED' && this._timer > 45) {
      // lv1 topu koru, step 1'e geç
      const lv1 = state.circles.find(c => c.level === 1);
      state.circles = lv1 ? [lv1] : [];
      this.startStep(1, 'SPAWN_LV2');
    }
  }

  // ── Step 1: lv2 düşür → lv1'i absorb ───────────────────────────────────

  _s1() {
    if (this._phase === 'SPAWN_LV2' || (this._phase === 'INIT' && this._timer > 10)) {
      state.circles.push(spawnBall(2, 0));
      this._phase = 'WAIT_SETTLE2'; this._timer = 0;
    }

    if (this._phase === 'WAIT_SETTLE2') {
      const lv2 = this._byLv(2);
      if (lv2 && (settled(lv2) || this._timer > 80) && this._timer > 15) {
        const lv1 = this._byLv(1);
        this._showHint  = true;
        this._hintAlpha = 0;
        if (lv1 && lv2) this._arrow = { sx: lv1.x, sy: lv1.y, tx: lv2.x, ty: lv2.y };
        this._phase = 'WAIT_ABSORB'; this._timer = 0;
      }
    }

    if (this._phase === 'WAIT_ABSORB') {
      const lv1 = this._byLv(1), lv2 = this._byLv(2);
      if (this._arrow && lv1 && lv2) {
        this._arrow.sx = lv1.x; this._arrow.sy = lv1.y;
        this._arrow.tx = lv2.x; this._arrow.ty = lv2.y;
      }
      if (!this._byLv(1) && this._byLv(2)) {
        this._showHint = false; this._arrow = null;
        this._phase = 'ABSORBED'; this._timer = 0;
      }
    }

    if (this._phase === 'ABSORBED' && this._timer > 45) {
      const lv2 = state.circles.find(c => c.level === 2);
      state.circles = lv2 ? [lv2] : [];
      this.startStep(2, 'SPAWN_LV0');
    }
  }

  // ── Step 2: lv0 düşür → absorb ──────────────────────────────────────────

  _s2() {
    if (this._phase === 'SPAWN_LV0' || (this._phase === 'INIT' && this._timer > 10)) {
      const lv2  = this._byLv(2);
      const xOff = lv2
        ? (lv2.x > state.CX ? -1 : 1) * (state.MAIN_R ?? 160) * 0.28
        : (state.MAIN_R ?? 160) * 0.28;
      state.circles.push(spawnBall(0, xOff));
      this._phase = 'WAIT_SETTLE3'; this._timer = 0;
    }

    if (this._phase === 'WAIT_SETTLE3') {
      const lv0 = this._byLv(0);
      if (lv0 && (settled(lv0) || this._timer > 80) && this._timer > 15) {
        const lv2 = this._byLv(2);
        this._showHint  = true;
        this._hintAlpha = 0;
        if (lv0 && lv2) this._arrow = { sx: lv0.x, sy: lv0.y, tx: lv2.x, ty: lv2.y };
        this._phase = 'WAIT_ABSORB2'; this._timer = 0;
      }
    }

    if (this._phase === 'WAIT_ABSORB2') {
      const lv0 = this._byLv(0), lv2 = this._byLv(2);
      if (this._arrow && lv0 && lv2) {
        this._arrow.sx = lv0.x; this._arrow.sy = lv0.y;
        this._arrow.tx = lv2.x; this._arrow.ty = lv2.y;
      }
      if (!this._byLv(0) && this._byLv(2)) {
        this._showHint = false; this._arrow = null;
        this._phase = 'ABSORBED2'; this._timer = 0;
      }
    }

    if (this._phase === 'ABSORBED2' && this._timer > 45) {
      state.circles = [];
      this.startStep(3);
    }
  }

  // ── Step 3: popup ────────────────────────────────────────────────────────

  _s3() {
    if (this._phase === 'INIT') {
      state.circles = []; state.nextBall = null; state.heldBall = null;
      state.tutShowPopup = true;
      this._phase = 'POPUP';
    }
  }

  // ── Ok çizimi ────────────────────────────────────────────────────────────

  _drawArrow() {
    const a = this._arrow;
    if (!a) return;
    const ctx = state.ctx, S = state.S ?? 1;
    const accentColor = this._accentColor();
    const dx = a.tx - a.sx, dy = a.ty - a.sy;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const nx = dx / dist, ny = dy / dist;

    // Zıplayan ok offseti
    const bounce = Math.sin(Date.now() / 240) * 10 * S;
    const ox = a.sx + nx * bounce, oy = a.sy + ny * bounce;

    const fromX = ox + nx * 16 * S, fromY = oy + ny * 16 * S;
    const toX = a.tx - nx * 16 * S, toY = a.ty - ny * 16 * S;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth   = 3.5 * S;
    ctx.lineCap     = 'round';
    ctx.setLineDash([9 * S, 6 * S]);
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ok başı
    const hw = 11 * S, hl = 15 * S;
    const px = -ny, py = nx;
    ctx.beginPath();
    ctx.moveTo(toX + nx * hl, toY + ny * hl);
    ctx.lineTo(toX + px * hw, toY + py * hw);
    ctx.lineTo(toX - px * hw, toY - py * hw);
    ctx.closePath();
    ctx.fillStyle = accentColor; ctx.fill();

    ctx.restore();
  }

  // ── Label çizimi ─────────────────────────────────────────────────────────

  _label() {
    if (this._step === 0 && this._phase === 'WAIT_MERGE')   return 'Drag onto the other ball';
    if (this._step === 1 && this._phase === 'WAIT_ABSORB')  return 'Drag small onto big';
    if (this._step === 2 && this._phase === 'WAIT_ABSORB2') return 'Absorb again!';
    return null;
  }

  _drawLabel(text) {
    const { ctx, CX, CY, S } = state;
    const accentColor = this._accentColor();
    const y = CY;

    ctx.save();
    ctx.globalAlpha  = 1;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    const fs  = Math.round(Math.max(18, 22 * S));
    const pad = 16 * S;
    ctx.font  = `bold ${fs}px "ui-rounded","Arial Rounded MT Bold",sans-serif`;
    const tw  = ctx.measureText(text).width;
    const pw  = tw + pad * 2, ph = fs + pad * 1.4;

    // Pill arka plan
    ctx.beginPath(); this._rr(ctx, CX - pw / 2, y - ph / 2, pw, ph, ph * 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fill();
    ctx.strokeStyle = accentColor; ctx.lineWidth = 3; ctx.stroke();

    // Metin
    ctx.fillStyle = accentColor;
    ctx.fillText(text, CX, y);

    ctx.restore();
  }

  // Accent = border ile aynı renk (en yüksek level top rengi veya LEVELS[0])
  _accentColor() {
    const { circles, LEVELS } = state;
    if (!LEVELS || LEVELS.length === 0) return '#fff';
    let top = 0;
    for (const c of circles) {
      if (c.level > top) top = c.level;
      for (const lv of c.contains) if (lv > top) top = lv;
    }
    return LEVELS[top]?.color || LEVELS[0].color;
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  _byLv(lv) { return state.circles.find(c => c.level === lv); }

  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
  }
}
