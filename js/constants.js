// ── constants.js ──────────────────────────────────────────────────
export const TUTORIAL_LEVELS = 1;

export function buildLayout() {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const CSS_W = window.innerWidth, CSS_H = window.innerHeight;
  const W = CSS_W, H = CSS_H, MIN_DIM = Math.min(W, H), CX = W / 2;
  const S = MIN_DIM / 800;

  // Safe area: CSS env() değişkenini oku (Android nav bar, iPhone home indicator)
  const safeBot = (() => {
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);visibility:hidden';
      document.body.appendChild(el);
      const v = parseInt(getComputedStyle(el).height) || 0;
      document.body.removeChild(el);
      return Math.max(v, 0);
    } catch (_) { return 0; }
  })();

  // SCORE_AREA: H'ın %27'si, min 160 max 250 — küçük ekranlarda büyük alanı engelleriz
  const SCORE_AREA = Math.max(160, Math.min(250, Math.round(H * 0.27)));

  // BTN_PAD: ekran genişliğinin %2.5'i
  const BTN_PAD = Math.max(8, Math.round(MIN_DIM * 0.025));

  // Alt güvenlik payı: safe area + minimum boşluk
  const BTN_BOTTOM_PAD = Math.max(12, safeBot + 8);

  // MAIN_R: mevcut alanı blast button için yer bırakarak hesapla
  const _R_EST       = Math.floor(Math.min(W * 0.46, (H - SCORE_AREA - BTN_BOTTOM_PAD) / 2 - 2));
  const BTN_H_EST    = Math.round(_R_EST * 0.62 * 0.42);
  const BOTTOM_PAD   = BTN_H_EST + BTN_PAD + BTN_BOTTOM_PAD;
  const MAIN_R       = Math.floor(Math.min(W * 0.46, (H - SCORE_AREA - BOTTOM_PAD) / 2 - 2));
  const CY           = SCORE_AREA + MAIN_R + Math.round((H - SCORE_AREA - BOTTOM_PAD - MAIN_R * 2) / 2);

  return { DPR, CSS_W, CSS_H, W, H, MIN_DIM, CX, CY, MAIN_R, S, SCORE_AREA, BTN_PAD, BTN_BOTTOM_PAD };
}

// Boyut oranları — renkten bağımsız
const LEVEL_RATIOS = [
  { ratio:  42/360, vy: 1.4 }, // 0 — en küçük
  { ratio:  53/360, vy: 1.8 }, // 1
  { ratio:  68/360, vy: 2.2 }, // 2
  { ratio:  86/360, vy: 2.7 }, // 3
  { ratio: 109/360, vy: 3.2 }, // 4
  { ratio: 139/360, vy: 3.8 }, // 5
  { ratio: 176/360, vy: 4.5 }, // 6 — en büyük
];

// ── Shape yapısal katsayıları (renderer + physics paylaşır) ─────────
// Her değer c.r çarpanı. Renderer çizimde, physics _circles()'da kullanır.
export const SHAPE_DEFS = {
  jellybear: {
    body:  { oy:  0.12, r: 0.72 },
    head:  { oy: -0.38, r: 0.48 },
    earL:  { ox: -0.36, oy: -0.72, r: 0.20 },
    earR:  { ox:  0.36, oy: -0.72, r: 0.20 },
    armL:  { ox: -0.72, oy:  0.08, r: 0.20 },
    armR:  { ox:  0.72, oy:  0.08, r: 0.20 },
    footL: { ox: -0.36, oy:  0.70, r: 0.22 },
    footR: { ox:  0.36, oy:  0.70, r: 0.22 },
  },
  bear: {
    body:  { oy:  0.12, r: 0.72 },
    head:  { oy: -0.38, r: 0.48 },
    earL:  { ox: -0.36, oy: -0.72, r: 0.20 },
    earR:  { ox:  0.36, oy: -0.72, r: 0.20 },
    armL:  { ox: -0.72, oy:  0.08, r: 0.20 },
    armR:  { ox:  0.72, oy:  0.08, r: 0.20 },
    footL: { ox: -0.36, oy:  0.70, r: 0.22 },
    footR: { ox:  0.36, oy:  0.70, r: 0.22 },
  },
  matrushka: {
    body: { oy:  0.18, rw: 0.72, rh: 0.78 },
    head: { oy: -0.38, r:  0.38 },
  },
  duck: {
    body:  { oy:  0.08, rw: 0.82, rh: 0.72 },
    head:  { ox:  0.42, oy: -0.52, r: 0.32 },
    beak:  { ox:  0.76, oy: -0.60, r: 0.38 }, // physics collision
    beakTipX: 2.10, // gaga ucu (head.ox + head.r * beakTipX) — renderer
  },
  fish: {
    body:  { ox:  0.05, rw: 0.90, rh: 0.78 },
    tail:  { ox: -0.80, r:  0.30 },
  },
};

const FALLBACK_PALETTE = ['#FF5EBC','#FFD700','#FF9500','#00C853','#00B0FF','#AA00FF','#FF1744'];

/**
 * palette: world-config'den gelen 7 renk (küçükten büyüğe)
 * palette[0] = level 0 (en küçük), palette[6] = level 6 (en büyük)
 */
export function buildLevels(MAIN_R, palette, shape = 'sphere') {
  const colors = (palette && palette.length >= 7) ? palette : FALLBACK_PALETTE;
  return LEVEL_RATIOS.map((lv, i) => ({
    r: Math.round(MAIN_R * lv.ratio),
    color: colors[i],
    vy: lv.vy,
    shape,
  }));
}

export const LEVEL_DEFS = [

  // ── TUTORIAL (0-1) ─────────────────────────────────────────────
  {goals:[{level:1,contains:[0]}]},  // TUT0 — absorb tanıtım
  {goals:[{level:2,contains:[1]}]},  // TUT1 — merge + absorb zincir

  // ── CP 01 (L1-10): Tanışma ─────────────────────────────────────
  {goals:[{level:1,contains:[0]}]},  // L01 — tek absorb
  {goals:[{level:2,contains:[1]}]},  // L02 — bir üst
  {goals:[{level:1,contains:[0]},{level:1,contains:[0]}]},  // L03 — 2 slot, aynı hedef
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L04 — 2 slot, farklı
  {goals:[{level:2,contains:[1,0]}]},  // L05 — 2 derin zincir
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L06 — yükseliş
  {goals:[{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L07 — derin + normal
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L08 — çift aynı
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]}]},  // L09 — boss
  {goals:[{level:1,contains:[0]},{level:1,contains:[0]}]},  // L10 — nefes, basit çift

  // ── CP 02 (L11-20): Derinlik ───────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L11 — giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L12
  {goals:[{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L13 — derin giriş
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L14 — 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L15 — lv4 giriş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L16 — derin lv4
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L17 — çift derin
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L18 — 3 slot yükseliş
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L19 — boss çift derin
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]}]},  // L20 — nefes

  // ── CP 03 (L21-30): Zincir Ustası ─────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L21 — giriş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L22 — 3 slot
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L23 — derin
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L24 — 3 derin slot
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L25 — lv5 giriş
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L26 — derin lv5
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L27 — çift derin
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L28 — 3 slot boss
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},  // L29 — boss çift
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]},{level:2,contains:[1]}]},  // L30 — nefes 3 slot kolay

  // ── CP 04 (L31-40): Twist ──────────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L31 — giriş çift aynı
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L32
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L33 — 3 slot çift lv4
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]}]},  // L34 — lv5 vs derin
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L35 — 3 slot
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L36 — çift lv5
  {goals:[{level:6,contains:[5]},{level:5,contains:[4,3]}]},  // L37 — lv6 giriş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L38 — derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L39 — boss 3 derin
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L40 — nefes

  // ── CP 05 (L41-50): Momentum ───────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L41 — giriş 3 slot
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L42 — çift derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L43 — tırmanış
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L44 — çift derin lv5
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L45 — 3 slot
  {goals:[{level:6,contains:[5]},{level:5,contains:[4,3]}]},  // L46 — lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L47 — 3 slot lv6
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5]},{level:5,contains:[4,3]}]},  // L48 — çift lv6
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L49 — boss 4 derin
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L50 — nefes

  // ── CP 06 (L51-60) ─────────────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L51 giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L52
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]},{level:1,contains:[0]}]},  // L53 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L54 3 slot yükseliş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L55
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L56 çift lv4
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L57 3 slot derin
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L58 boss çift
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L59 boss
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L60 nefes

  // ── CP 07 (L61-70) ─────────────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L61 giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L62
  {goals:[{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L63 derin
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L64 3 slot yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L65 derin lv4
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L66 çift derin
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L67 3 slot derin
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L68 boss çift
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L69 boss
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L70 nefes

  // ── CP 08 (L71-80) ─────────────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L71 giriş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L72
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L73 derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L74 3 slot yükseliş
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L75 derin lv5
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L76 çift derin
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L77 3 slot derin
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},  // L78 boss çift
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L79 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L80 nefes

  // ── CP 09 (L81-90) ─────────────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L81 giriş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L82
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L83 derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L84 3 slot yükseliş
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L85 derin lv5
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L86 çift derin
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L87 3 slot derin
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},  // L88 boss çift
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L89 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L90 nefes

  // ── CP 10 (L91-100) ─────────────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L91 giriş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L92
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L93 derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L94 3 slot yükseliş
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L95 derin lv5
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L96 çift derin
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L97 3 slot derin
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]}]},  // L98 boss derin
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L99 boss 3 slot
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L100 nefes

  // ── CP 11 (L101-110) ─────────────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L101 giriş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L102
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L103 derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]},{level:3,contains:[2]}]},  // L104 3 slot yükseliş
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L105 derin lv5
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L106 çift derin
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L107 3 slot derin
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]}]},  // L108 boss derin
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L109 boss 3 slot
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L110 nefes

  // ── CP 12 (L111-120) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L111 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L112
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L113 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L114 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L115 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L116 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L117 3 slot derin
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},  // L118 boss çift
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L119 boss
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L120 nefes

  // ── CP 13 (L121-130) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L121 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L122
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L123 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L124 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L125 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L126 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L127 3 slot derin
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},  // L128 boss çift
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L129 boss
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L130 nefes

  // ── CP 14 (L131-140) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L131 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L132
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L133 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L134 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L135 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L136 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L137 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L138 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L139 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L140 nefes

  // ── CP 15 (L141-150) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L141 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L142
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L143 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L144 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L145 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L146 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L147 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L148 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L149 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L150 nefes

  // ── CP 16 (L151-160) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L151 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L152
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L153 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L154 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L155 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L156 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L157 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L158 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L159 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L160 nefes

  // ── CP 17 (L161-170) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L161 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L162
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L163 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L164 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L165 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L166 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L167 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L168 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L169 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L170 nefes

  // ── CP 18 (L171-180) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L171 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L172
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L173 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L174 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L175 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L176 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L177 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L178 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L179 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L180 nefes

  // ── CP 19 (L181-190) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L181 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L182
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L183 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L184 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L185 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L186 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L187 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L188 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L189 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L190 nefes

  // ── CP 20 (L191-200) ─────────────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L191 giriş
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L192
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L193 derin
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]},{level:4,contains:[3]}]},  // L194 3 slot yükseliş
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4]}]},  // L195 derin lv6
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L196 çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L197 3 slot derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L198 boss derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L199 boss 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L200 nefes

];


export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
