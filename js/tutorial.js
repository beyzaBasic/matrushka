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
    // Popup/success kart animasyon cache'i sıfırla — temiz başlasın
    if (this._cards) {
      delete this._cards['tut'];
    }
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
    if (label) {
      const target = this._labelTarget();
      this._drawLabel(label, target?.x, target?.y);
    }
    if (this._arrow) this._drawArrow();
  }

  // "How to Play" popup — drawCelebrationCard ile çizilir
  drawPopup() {
    if (!state.tutShowPopup) return;
    this.drawCelebrationCard({
      key:        'tut',
      title:      'READY?',
      ctaLabel:   'PLAY!',
      showDemo:   true,
      btnRectKey: '_tutPopupBtn',
    });
  }

  // Level success ekranı — aynı şenlik kartını kullanır.
  // alpha: state.levelSuccessAlpha (0–1) — fade-in için
  // stars: state.levelStars (0–3)
  // ctaLabel: dinamik — "Level X ▶" veya "Start Game ▶"
  drawSuccess({ alpha, stars, ctaLabel }) {
    this.drawCelebrationCard({
      key:        'success',
      title:      'SUCCESS!',
      ctaLabel,
      showDemo:   false,
      stars,
      btnRectKey: '_nextLevelBtn',
      alpha,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PAYLAŞILAN ŞENLİK KARTI — hem tutorial popup hem level success kullanır
  // opts:
  //   key        : animasyon state için unique anahtar ('tut' | 'success')
  //   title      : büyük üst yazı (örn. 'READY?', 'LEVEL CLEAR!')
  //   subtitle   : opsiyonel alt başlık (örn. 'You got it!')
  //   ctaLabel   : buton metni (örn. 'PLAY!', 'NEXT!')
  //   showDemo   : true → merge/absorb demo, false → ortada stars
  //   stars      : 0–3, showDemo=false ise gösterilir
  //   btnRectKey : tıklama hit-area için state anahtarı
  //   alpha      : fade-in animasyonu için (0–1, default 1)
  // TASARIM NOTU: Kart arka planı sade (soft koyu blur), buton parlak/canlı kalır
  // → buton ön plana çıkar.
  // ─────────────────────────────────────────────────────────────────────────
  drawCelebrationCard(opts) {
    const {
      key, title, subtitle, ctaLabel,
      showDemo = false, stars = 0,
      btnRectKey = '_tutPopupBtn',
      alpha = 1,
    } = opts;

    // Animasyon state cache (her panel kendi t/confetti'sini taşır)
    if (!this._cards) this._cards = {};
    if (!this._cards[key]) {
      this._cards[key] = { t: 0, confetti: this._makeConfetti() };
    }
    const cardState = this._cards[key];
    cardState.t++;
    const t = cardState.t;

    const ctx = state.ctx;
    const { W, H, CX, CY, S } = state;
    const font = `"ui-rounded","Arial Rounded MT Bold",sans-serif`;

    // ── Backdrop (arkada gameplay yarı görünür kalsın) ──────────────────────
    const dimAlpha = Math.min(0.55, t * 0.03) * alpha;
    ctx.fillStyle = `rgba(0,0,0,${dimAlpha})`;
    ctx.fillRect(0, 0, W, H);
    // Hafif radial koyulaşma — kartın etrafı için ek vurgu
    const vGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.7);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, `rgba(0,0,0,${dimAlpha * 0.5})`);
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, W, H);

    // Confetti
    this._drawConfettiInto(cardState.confetti, t);

    // Elastic scale-in
    const ep = Math.min(1, t / 22);
    const elastic = ep < 1
      ? 1 + Math.pow(2, -10 * ep) * Math.sin((ep - 0.075) * (2 * Math.PI / 0.3))
      : 1;
    const cardScale = ep < 1 ? elastic : 1;

    // Card boyutu
    const cw = Math.min(W * 0.88, 340 * S);
    const ch = (showDemo ? 340 : 320) * S;
    const cx = CX - cw / 2;
    const cy = CY - ch / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(CX, CY);
    ctx.scale(cardScale, cardScale);
    ctx.translate(-CX, -CY);

    // ── Card body — SADE (koyu yarı saydam, glassmorphism hissi) ─────────────
    // Eski canlı turuncu→pembe→mor gradient kaldırıldı.
    // Yeni: ince koyu kart → buton parlak sarısı ön plana çıkıyor.
    ctx.beginPath(); this._rr(ctx, cx, cy, cw, ch, 28 * S);
    ctx.fillStyle = 'rgba(20, 18, 40, 0.72)';
    ctx.fill();

    // İnce beyaz iç çerçeve (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.5 * S;
    ctx.stroke();

    // Sparkles kaldırıldı (kart sade)

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // Başlık — büyük, beyaz, hafif bouncing
    const headerBounce = Math.sin(t / 22) * 2 * S;
    const titleFs = Math.round(42 * S);
    ctx.font = `900 ${titleFs}px ${font}`;
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillText(title, CX, cy + 62 * S + headerBounce + 3 * S);
    ctx.fillStyle = '#fff';
    ctx.fillText(title, CX, cy + 62 * S + headerBounce);

    // Alt başlık
    if (subtitle) {
      ctx.font = `600 ${Math.round(14 * S)}px ${font}`;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillText(subtitle, CX, cy + 95 * S);
    }

    // Demo veya stars
    if (showDemo) {
      this._drawDemoRow(cx, cy + 110 * S, cw, t);
    } else {
      this._drawCardStars(cx, cy + 140 * S, cw, stars, t);
    }

    // CTA buton — parlak/canlı (ön planda)
    const btnPulse = 1 + Math.sin(t / 9) * 0.045;
    const btnRot   = Math.sin(t / 14) * 0.025;
    const bw = cw * 0.78;
    const bh = 62 * S;
    const bx = CX - bw / 2;
    const by = cy + ch - 84 * S;
    const bcx = CX, bcy = by + bh / 2;

    ctx.save();
    ctx.translate(bcx, bcy);
    ctx.rotate(btnRot);
    ctx.scale(btnPulse, btnPulse);
    ctx.translate(-bcx, -bcy);

    // Shadow (buton altına derinlik — koyu kartta daha belirgin)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath(); this._rr(ctx, bx, by + 6 * S, bw, bh, bh * 0.45);
    ctx.fill();

    // Body — yeşil gradient
    const btnGrad = ctx.createLinearGradient(0, by, 0, by + bh);
    btnGrad.addColorStop(0, '#69F0AE');
    btnGrad.addColorStop(0.5, '#00E676');
    btnGrad.addColorStop(1, '#00C853');
    ctx.beginPath(); this._rr(ctx, bx, by, bw, bh, bh * 0.45);
    ctx.fillStyle = btnGrad; ctx.fill();

    // Shine (üst yarı parlama)
    ctx.beginPath(); this._rr(ctx, bx + 10 * S, by + 5 * S, bw - 20 * S, bh * 0.42, bh * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.50)'; ctx.fill();

    // Border
    ctx.beginPath(); this._rr(ctx, bx, by, bw, bh, bh * 0.45);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3 * S;
    ctx.stroke();

    // Text — koyu yeşil
    ctx.font = `900 ${Math.round(22 * S)}px ${font}`;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillText(ctaLabel, CX, bcy + 3 * S);
    ctx.fillStyle = '#1B5E20';
    ctx.fillText(ctaLabel, CX, bcy);

    // İki dans eden yıldız
    const starPhase = t / 22;
    const star1X = bx + 22 * S + Math.sin(starPhase) * 3 * S;
    const star2X = bx + bw - 22 * S + Math.sin(starPhase + 1) * 3 * S;
    ctx.fillStyle = '#fff';
    this._drawSparkle(ctx, star1X, bcy, 3 * S);
    this._drawSparkle(ctx, star2X, bcy, 3 * S);

    ctx.restore();

    // Hit area (transform öncesi rect — input handler bunu kullanır)
    state[btnRectKey] = { x: bx, y: by, w: bw, h: bh, a: alpha };

    ctx.restore();
  }

  // Animasyon state'ini sıfırla (level değişince çağrılır)
  resetCardState(key) {
    if (this._cards && this._cards[key]) delete this._cards[key];
  }

  // Stars çizimi — 3 yıldız, kazanılanlar dolu, sallanan
  _drawCardStars(cx, cy, cw, stars, t) {
    const ctx = state.ctx;
    const { S } = state;
    const starR = 24 * S;
    const gap = starR * 2.4;
    const totalW = starR * 2 + gap * 2;
    const startX = cx + cw / 2 - totalW / 2 + starR;
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * gap;
      const filled = i < stars;
      const appearAt = i * 12; // sırayla görün
      const localT = Math.max(0, t - appearAt);
      if (localT === 0) continue;
      const popScale = localT < 18 ? 0.3 + (localT / 18) * 0.85 : 1 + Math.sin(t / 12 + i) * 0.08;
      ctx.save();
      ctx.translate(sx, cy);
      ctx.scale(popScale, popScale);
      // Yıldız path
      ctx.beginPath();
      for (let pt = 0; pt < 5; pt++) {
        const a1 = (pt * 4 * Math.PI / 5) - Math.PI / 2, a2 = a1 + 2 * Math.PI / 5;
        const ox = Math.cos(a1) * starR, oy = Math.sin(a1) * starR;
        const ix = Math.cos(a2) * starR * 0.42, iy = Math.sin(a2) * starR * 0.42;
        pt === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      if (filled) {
        const sg = ctx.createRadialGradient(-starR * 0.2, -starR * 0.2, 0, 0, 0, starR);
        sg.addColorStop(0, '#FFF8B0');
        sg.addColorStop(0.5, '#FFD93D');
        sg.addColorStop(1, '#FF9F1C');
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * S; ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5 * S; ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawConfettiInto(confetti, t) {
    if (!confetti) return;
    const ctx = state.ctx;
    const { H, W, S } = state;
    ctx.save();
    for (const p of confetti) {
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

    // Renkler — demo için sabit hypercasual paleti
    // Merge: SARI + SARI → TURUNCU
    // Absorb: dış PEMBE içi TURUNCU (turuncu pembeye giriyor)
    const cYellow = '#FFD93D';  // sarı — merge başlangıç
    const cOrange = '#FF9F1C';  // turuncu — merge sonucu + absorb küçük
    const cPink   = '#FF6B9D';  // pembe — absorb büyük top

    // Ortak: divider çizgi — beyaz transparan
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5 * S;
    ctx.beginPath();
    ctx.moveTo(cx + colW, cy + 15 * S);
    ctx.lineTo(cx + colW, cy + demoH - 15 * S);
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
      // İki sarı top
      this._drawDemoBall(ctx, leftX, animY, ballR, cYellow);
      this._drawDemoBall(ctx, rightX, animY, ballR, cYellow);
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
      this._drawDemoBall(ctx, merge_cx, animY, r, cOrange);
    }
    ctx.restore();

    // Merge label — başlık + alt başlık, beyaz
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.round(14 * S)}px ${font}`;
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillText('MERGE', merge_cx, cy + 102 * S + 2 * S);
    ctx.fillStyle = '#fff';
    ctx.fillText('MERGE', merge_cx, cy + 102 * S);
    // Alt başlık
    ctx.font = `600 ${Math.round(10 * S)}px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('same + same', merge_cx, cy + 118 * S);

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
    // Büyük top — PEMBE
    const bigPulse = phase > 0.45 && phase < 0.75 ? 1 + Math.sin((phase - 0.45) / 0.3 * Math.PI) * 0.12 : 1;
    this._drawDemoBall(ctx, absorb_cx, animY, bigR * bigPulse, cPink);
    // İç halka (nested görünüm) — absorb tamamlanınca, içi TURUNCU
    if (phase > 0.65) {
      const innerAlpha = Math.min(1, (phase - 0.65) / 0.15);
      ctx.fillStyle = `rgba(255,255,255,${innerAlpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(absorb_cx, animY, bigR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cOrange;
      ctx.globalAlpha = innerAlpha;
      ctx.beginPath();
      ctx.arc(absorb_cx, animY, bigR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Küçük top (yaklaşan) — TURUNCU
    if (smallAlpha > 0) {
      ctx.globalAlpha = smallAlpha;
      this._drawDemoBall(ctx, smallX, animY, ballR * smallScale, cOrange);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Absorb label — başlık + alt başlık, beyaz
    ctx.font = `900 ${Math.round(14 * S)}px ${font}`;
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillText('ABSORB', absorb_cx, cy + 102 * S + 2 * S);
    ctx.fillStyle = '#fff';
    ctx.fillText('ABSORB', absorb_cx, cy + 102 * S);
    // Alt başlık
    ctx.font = `600 ${Math.round(10 * S)}px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('big eats small', absorb_cx, cy + 118 * S);
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
      const right = spawnBall(0, +xOff);
      state.circles.push(right);
      const left = state.circles.find(c => c.level === 0 && c !== right);
      if (left) {
        const r = right.x > left.x ? right : left;
        const l = right.x > left.x ? left : right;
        this._arrow = { sx: r.x, sy: r.y, tx: l.x, ty: l.y };
      }
      this._phase = 'WAIT_MERGE'; this._timer = 0;
    }

    if (this._phase === 'WAIT_MERGE') {
      // Top düştükten sonra (~20 frame) hint'i göster
      if (!this._showHint && this._timer > 20) {
        this._showHint = true; this._hintAlpha = 0;
      }
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

    if (this._phase === 'MERGED' && this._timer > 5) {
      // lv1 topu koru, step 1'e hemen geç
      const lv1 = state.circles.find(c => c.level === 1);
      state.circles = lv1 ? [lv1] : [];
      this.startStep(1, 'SPAWN_LV2');
    }
  }

  // ── Step 1: lv2 düşür → lv1'i absorb ───────────────────────────────────

  _s1() {
    if (this._phase === 'SPAWN_LV2' || (this._phase === 'INIT' && this._timer > 10)) {
      const lv2 = spawnBall(2, 0);
      state.circles.push(lv2);
      const lv1 = this._byLv(1);
      if (lv1) this._arrow = { sx: lv1.x, sy: lv1.y, tx: lv2.x, ty: lv2.y };
      this._phase = 'WAIT_ABSORB'; this._timer = 0;
    }

    if (this._phase === 'WAIT_ABSORB') {
      // Top düştükten sonra (~20 frame) hint'i göster
      if (!this._showHint && this._timer > 20) {
        this._showHint = true; this._hintAlpha = 0;
      }
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

    if (this._phase === 'ABSORBED' && this._timer > 5) {
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
      const lv0 = spawnBall(0, xOff);
      state.circles.push(lv0);
      if (lv2) this._arrow = { sx: lv0.x, sy: lv0.y, tx: lv2.x, ty: lv2.y };
      this._phase = 'WAIT_ABSORB2'; this._timer = 0;
    }

    if (this._phase === 'WAIT_ABSORB2') {
      // Top düştükten sonra (~20 frame) hint'i göster
      if (!this._showHint && this._timer > 20) {
        this._showHint = true; this._hintAlpha = 0;
      }
      const lv0 = this._byLv(0), lv2 = this._byLv(2);
      if (this._arrow && lv0 && lv2) {
        this._arrow.sx = lv0.x; this._arrow.sy = lv0.y;
        this._arrow.tx = lv2.x; this._arrow.ty = lv2.y;
      }
      if (!this._byLv(0) && this._byLv(2)) {
        this._showHint = false; this._arrow = null;
        this._phase = 'ABSORBED2'; this._timer = 0;
        // Slot animasyonunu manuel tetikle — checkGoal tutorial'da erken döndüğü için
        // normal flying goal akışı çalışmaz. Burada elle başlatıyoruz.
        this._spawnTutFlyingGoal();
      }
    }

    if (this._phase === 'ABSORBED2' && this._timer > 90) {
      // 90 frame (~1.5s): flying goal animasyonu (~72 frame) + done-pulse görünür
      // Süre sonunda startStep slot'ları sıfırlar; popup _s3'te açılır.
      state.circles = [];
      this.startStep(3);
    }
  }

  // Tutorial son adımda slot dolma animasyonunu manuel tetikler.
  // goals.checkGoal tutorial'da false döndüğü için flying goal kendiliğinden
  // başlamaz; bu helper aynı veri yapısını elle oluşturur.
  _spawnTutFlyingGoal() {
    const lv2 = this._byLv(2);
    if (!lv2) return;
    const { LEVELS } = state;
    // Slot pozisyonunu hesapla — goals.js:goalSlotPos ile uyumlu
    const { CX, MIN_DIM } = state;
    const GEM_R = 64; // tek slot için (TUT_GOALS tek goal'lu)
    const TOP = 10, TTL = Math.round(28 * MIN_DIM / 800) + 8, MID = 4;
    const gemTop = TOP + TTL + MID;
    const cx = CX, cy = gemTop + GEM_R;
    const ballR = Math.round(GEM_R * 0.72);
    // Flying goal entry'sini ekle
    state.flyingGoals.push({
      slotIdx: 0,
      x: lv2.x, y: lv2.y, tx: cx, ty: cy,
      r: ballR, level: 2, contains: [1, 0],
      t: 0, maxT: 72
    });
    state.goalSlots[0] = 'flying';
    // Arena'daki lv2'yi kaldır — yoksa sahnede kopya kalır
    // (flying goal görsel olarak lv2'nin yerinden çıkıyor gibi başlar, doğal hisseder)
    state.circles = state.circles.filter(c => c !== lv2);
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

  // Hint yazısının topların üzerindeki (padding'li) pozisyonunu ve rengini döndürür
  _labelTarget() {
    const { circles, LEVELS, S } = state;
    const pad = 22 * (S ?? 1);

    if (this._step === 0 && this._phase === 'WAIT_MERGE') {
      const bs = circles.filter(c => c.level === 0);
      if (bs.length >= 2) {
        const mx  = (bs[0].x + bs[1].x) / 2;
        const top = Math.min(bs[0].y - bs[0].r, bs[1].y - bs[1].r);
        return { x: mx, y: top - pad, color: LEVELS?.[0]?.color };
      }
    }
    if (this._step === 1 && this._phase === 'WAIT_ABSORB') {
      const lv1 = this._byLv(1), lv2 = this._byLv(2);
      if (lv1 && lv2) {
        const mx  = (lv1.x + lv2.x) / 2;
        const top = Math.min(lv1.y - lv1.r, lv2.y - lv2.r);
        return { x: mx, y: top - pad, color: LEVELS?.[1]?.color };
      }
    }
    if (this._step === 2 && this._phase === 'WAIT_ABSORB2') {
      const lv0 = this._byLv(0), lv2 = this._byLv(2);
      if (lv0 && lv2) {
        const mx  = (lv0.x + lv2.x) / 2;
        const top = Math.min(lv0.y - lv0.r, lv2.y - lv2.r);
        return { x: mx, y: top - pad, color: LEVELS?.[0]?.color };
      }
    }
    return null;
  }

  _drawLabel(text, posX, posY) {
    const { ctx, CX, CY, S } = state;
    const font = `"ui-rounded","Arial Rounded MT Bold",sans-serif`;
    const t = (this._labelT = (this._labelT || 0) + 1);
    const bob = Math.sin(t / 13) * 7 * (S ?? 1);
    const x = posX ?? CX;
    const y = (posY ?? CY) + bob;

    const isDark = state.isDarkMode;
    ctx.save();
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(32 * (S ?? 1))}px ${font}`;
    ctx.shadowColor  = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)';
    ctx.shadowBlur   = 6 * (S ?? 1);
    ctx.fillStyle    = isDark ? '#FFFFFF' : '#1A1040';
    ctx.fillText(text, x, y);
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
