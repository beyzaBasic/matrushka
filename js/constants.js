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
  // ── TUTORIAL ──────────────────────────────────
  {goals:[{level:1,contains:[0]}]},  // TUT0 — ilk absorb
  {goals:[{level:2,contains:[1,0]}]},  // TUT1 — 2 katlı zincir
  // ── CP 01: İlk Temas ──────────────────────────────────
  {goals:[{level:1,contains:[0]}]},  // L01
  {goals:[{level:2,contains:[1]}]},  // L02
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L03 — büyük sol
  {goals:[{level:1,contains:[0]},{level:2,contains:[1]}]},  // L04 — büyük sağ
  {goals:[{level:2,contains:[1,0]}]},  // L05 — zincir
  {goals:[{level:1,contains:[0]},{level:1,contains:[0]},{level:2,contains:[1]}]},  // L06 — 3 slot
  {goals:[{level:3,contains:[2]},{level:1,contains:[0]}]},  // L07 — asimetri
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]}]},  // L08 — çift merge
  {goals:[{level:3,contains:[2,1,0]},{level:1,contains:[0]}]},  // L09 — boss: 4 derin + bozucu
  {goals:[{level:2,contains:[1]}]},  // L10 — nefes
  // ── CP 02: Karışık Boyut ──────────────────────────────────
  {goals:[{level:1,contains:[0]},{level:3,contains:[2]}]},  // L11 — küçük önce
  {goals:[{level:3,contains:[2]},{level:1,contains:[0]},{level:2,contains:[1]}]},  // L12 — 3 slot karışık
  {goals:[{level:1,contains:[0]},{level:2,contains:[1]},{level:3,contains:[2]}]},  // L13 — artan sıra
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]},{level:1,contains:[0]}]},  // L14 — çift merge + bozucu
  {goals:[{level:3,contains:[2,1,0]}]},  // L15 — tek uzun zincir
  {goals:[{level:2,contains:[1]},{level:3,contains:[2,1]}]},  // L16 — normal + derin
  {goals:[{level:4,contains:[3]},{level:1,contains:[0]}]},  // L17 — lv4 + bozucu
  {goals:[{level:4,contains:[3,2]},{level:2,contains:[1]},{level:1,contains:[0]}]},  // L18 — derin + 2 küçük
  {goals:[{level:4,contains:[3,2,1]},{level:2,contains:[1]}]},  // L19 — boss: 4 derin + normal
  {goals:[{level:1,contains:[0]},{level:1,contains:[0]}]},  // L20 — nefes
  // ── CP 03: Asimetri ──────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:1,contains:[0]},{level:1,contains:[0]}]},  // L21 — 1 büyük 2 bozucu
  {goals:[{level:2,contains:[1]},{level:4,contains:[3]}]},  // L22 — küçük önce büyük sonra
  {goals:[{level:4,contains:[3,2,1]},{level:1,contains:[0]}]},  // L23 — derin + tek bozucu
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:1,contains:[0]}]},  // L24 — çift merge + bozucu
  {goals:[{level:5,contains:[4]},{level:2,contains:[1]}]},  // L25 — lv5 giriş
  {goals:[{level:2,contains:[1]},{level:5,contains:[4]},{level:3,contains:[2]}]},  // L26 — lv5 ortada
  {goals:[{level:5,contains:[4,3,2]},{level:2,contains:[1]}]},  // L27 — 4 derin lv5
  {goals:[{level:3,contains:[2]},{level:5,contains:[4,3]}]},  // L28 — küçük önce büyük derin
  {goals:[{level:5,contains:[4,3,2,1]},{level:2,contains:[1]}]},  // L29 — boss: 5 derin
  {goals:[{level:2,contains:[1]},{level:3,contains:[2]}]},  // L30 — nefes
  // ── CP 04: Merge Odağı ──────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L31 — çift merge
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]},{level:1,contains:[0]}]},  // L32 — çift lv4 + bozucu
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]},{level:4,contains:[3]}]},  // L33 — merge önce sonra büyük
  {goals:[{level:5,contains:[4]},{level:3,contains:[2]},{level:3,contains:[2]}]},  // L34 — lv5 + çift merge
  {goals:[{level:4,contains:[3,2,1]},{level:4,contains:[3]}]},  // L35 — derin vs sade aynı lv
  {goals:[{level:3,contains:[2]},{level:5,contains:[4,3,2]},{level:1,contains:[0]}]},  // L36 — karışık orta
  {goals:[{level:6,contains:[5]},{level:3,contains:[2]},{level:3,contains:[2]}]},  // L37 — lv6 + çift merge
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4]}]},  // L38 — derin vs kısa
  {goals:[{level:6,contains:[5,4,3]},{level:3,contains:[2,1]},{level:1,contains:[0]}]},  // L39 — boss: iki derin + bozucu
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L40 — nefes çift merge
  // ── CP 05: Tempo ──────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:4,contains:[3]},{level:2,contains:[1]}]},  // L41 — büyük ortada
  {goals:[{level:5,contains:[4]},{level:2,contains:[1]},{level:4,contains:[3]}]},  // L42 — karışık
  {goals:[{level:4,contains:[3,2,1]},{level:2,contains:[1]},{level:3,contains:[2]}]},  // L43 — derin + 2 farklı
  {goals:[{level:3,contains:[2]},{level:5,contains:[4,3]},{level:3,contains:[2]}]},  // L44 — büyük ortada derin
  {goals:[{level:5,contains:[4,3,2]},{level:3,contains:[2]},{level:1,contains:[0]}]},  // L45 — derin + 2 bozucu
  {goals:[{level:6,contains:[5]},{level:4,contains:[3,2]},{level:2,contains:[1]}]},  // L46 — lv6 + orta + küçük
  {goals:[{level:2,contains:[1]},{level:6,contains:[5,4,3]},{level:3,contains:[2]}]},  // L47 — lv6 derin ortada
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5]},{level:3,contains:[2,1]}]},  // L48 — çift lv6 + derin küçük
  {goals:[{level:6,contains:[5,4,3,2]},{level:4,contains:[3,2]}]},  // L49 — boss: 5 derin + 3 derin
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L50 — nefes
  // ── CP 06: Kısa Zincir Baskısı ──────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L51 Kısa Zincir Baskısı — giriş
  {goals:[{level:4,contains:[3]},{level:2,contains:[1]},{level:1,contains:[0]}]},  // L52 Kısa Zincir Baskısı —
  {goals:[{level:2,contains:[1]},{level:4,contains:[3,2]},{level:1,contains:[0]}]},  // L53 Kısa Zincir Baskısı —
  {goals:[{level:4,contains:[3,2,1]},{level:3,contains:[2]}]},  // L54 Kısa Zincir Baskısı —
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:4,contains:[3]}]},  // L55 Kısa Zincir Baskısı —
  {goals:[{level:5,contains:[4,3]},{level:2,contains:[1]},{level:3,contains:[2]}]},  // L56 Kısa Zincir Baskısı —
  {goals:[{level:1,contains:[0]},{level:5,contains:[4,3,2]},{level:2,contains:[1]}]},  // L57 Kısa Zincir Baskısı —
  {goals:[{level:5,contains:[4,3,2,1]},{level:3,contains:[2]}]},  // L58 Kısa Zincir Baskısı — boss
  {goals:[{level:5,contains:[4,3,2]},{level:4,contains:[3,2,1]}]},  // L59 Kısa Zincir Baskısı — boss+
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]}]},  // L60 Kısa Zincir Baskısı — nefes
  // ── CP 07: Uzun Zincir Denemesi ──────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:1,contains:[0]},{level:2,contains:[1]}]},  // L61 Uzun Zincir Denemesi — giriş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L62 Uzun Zincir Denemesi —
  {goals:[{level:2,contains:[1]},{level:4,contains:[3,2,1]}]},  // L63 Uzun Zincir Denemesi —
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]},{level:2,contains:[1]}]},  // L64 Uzun Zincir Denemesi —
  {goals:[{level:5,contains:[4,3,2]},{level:2,contains:[1]},{level:1,contains:[0]}]},  // L65 Uzun Zincir Denemesi —
  {goals:[{level:3,contains:[2]},{level:5,contains:[4,3]},{level:3,contains:[2]}]},  // L66 Uzun Zincir Denemesi —
  {goals:[{level:5,contains:[4,3,2,1]},{level:2,contains:[1]}]},  // L67 Uzun Zincir Denemesi —
  {goals:[{level:4,contains:[3,2]},{level:5,contains:[4,3,2]}]},  // L68 Uzun Zincir Denemesi — boss
  {goals:[{level:5,contains:[4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L69 Uzun Zincir Denemesi — boss+
  {goals:[{level:3,contains:[2]},{level:1,contains:[0]}]},  // L70 Uzun Zincir Denemesi — nefes
  // ── CP 08: Asimetri Şoku ──────────────────────────────────
  {goals:[{level:4,contains:[3]},{level:1,contains:[0]}]},  // L71 Asimetri Şoku — giriş
  {goals:[{level:1,contains:[0]},{level:5,contains:[4,3]}]},  // L72 Asimetri Şoku —
  {goals:[{level:5,contains:[4,3,2]},{level:1,contains:[0]},{level:1,contains:[0]}]},  // L73 Asimetri Şoku —
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:5,contains:[4]}]},  // L74 Asimetri Şoku —
  {goals:[{level:6,contains:[5]},{level:3,contains:[2,1]}]},  // L75 Asimetri Şoku —
  {goals:[{level:3,contains:[2,1]},{level:6,contains:[5,4]}]},  // L76 Asimetri Şoku —
  {goals:[{level:6,contains:[5,4,3]},{level:2,contains:[1]},{level:1,contains:[0]}]},  // L77 Asimetri Şoku —
  {goals:[{level:6,contains:[5,4,3,2]},{level:3,contains:[2]}]},  // L78 Asimetri Şoku — boss
  {goals:[{level:6,contains:[5,4,3,2]},{level:4,contains:[3,2,1]}]},  // L79 Asimetri Şoku — boss+
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L80 Asimetri Şoku — nefes
  // ── CP 09: Merge Baskısı ──────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:1,contains:[0]}]},  // L81 Merge Baskısı — giriş
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]}]},  // L82 Merge Baskısı —
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]},{level:2,contains:[1]}]},  // L83 Merge Baskısı —
  {goals:[{level:5,contains:[4]},{level:5,contains:[4]},{level:2,contains:[1]}]},  // L84 Merge Baskısı —
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4]},{level:1,contains:[0]}]},  // L85 Merge Baskısı —
  {goals:[{level:4,contains:[3,2,1]},{level:4,contains:[3,2]}]},  // L86 Merge Baskısı —
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]}]},  // L87 Merge Baskısı —
  {goals:[{level:6,contains:[5]},{level:6,contains:[5]},{level:3,contains:[2]}]},  // L88 Merge Baskısı — boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L89 Merge Baskısı — boss+
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]}]},  // L90 Merge Baskısı — nefes
  // ── CP 10: Derin Zincir ──────────────────────────────────
  {goals:[{level:4,contains:[3,2,1]},{level:2,contains:[1]}]},  // L91 Derin Zincir — giriş
  {goals:[{level:2,contains:[1]},{level:5,contains:[4,3,2]}]},  // L92 Derin Zincir —
  {goals:[{level:5,contains:[4,3,2,1]},{level:1,contains:[0]}]},  // L93 Derin Zincir —
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]},{level:1,contains:[0]}]},  // L94 Derin Zincir —
  {goals:[{level:6,contains:[5,4]},{level:3,contains:[2,1]}]},  // L95 Derin Zincir —
  {goals:[{level:3,contains:[2,1]},{level:6,contains:[5,4,3]}]},  // L96 Derin Zincir —
  {goals:[{level:6,contains:[5,4,3,2]},{level:2,contains:[1]},{level:2,contains:[1]}]},  // L97 Derin Zincir —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:3,contains:[2]}]},  // L98 Derin Zincir — boss
  {goals:[{level:6,contains:[5,4,3,2]},{level:5,contains:[4,3,2,1]}]},  // L99 Derin Zincir — boss+
  {goals:[{level:2,contains:[1]},{level:3,contains:[2]}]},  // L100 Derin Zincir — nefes
  // ── CP 11: Karmaşa ──────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:4,contains:[3]},{level:2,contains:[1]}]},  // L101 Karmaşa — giriş
  {goals:[{level:5,contains:[4,3]},{level:3,contains:[2]},{level:1,contains:[0]}]},  // L102 Karmaşa —
  {goals:[{level:3,contains:[2]},{level:5,contains:[4,3,2]},{level:3,contains:[2]}]},  // L103 Karmaşa —
  {goals:[{level:6,contains:[5]},{level:2,contains:[1]},{level:4,contains:[3,2]}]},  // L104 Karmaşa —
  {goals:[{level:4,contains:[3,2,1]},{level:5,contains:[4,3]}]},  // L105 Karmaşa —
  {goals:[{level:5,contains:[4,3,2]},{level:4,contains:[3,2,1]},{level:1,contains:[0]}]},  // L106 Karmaşa —
  {goals:[{level:6,contains:[5,4,3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L107 Karmaşa —
  {goals:[{level:6,contains:[5,4,3,2]},{level:4,contains:[3,2]}]},  // L108 Karmaşa — boss
  {goals:[{level:6,contains:[5,4,3,2]},{level:5,contains:[4,3,2,1]},{level:2,contains:[1]}]},  // L109 Karmaşa — boss+
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L110 Karmaşa — nefes
  // ── CP 12: Uzun Zincir II ──────────────────────────────────
  {goals:[{level:5,contains:[4,3,2,1]},{level:2,contains:[1]}]},  // L111 Uzun Zincir II — giriş
  {goals:[{level:3,contains:[2]},{level:6,contains:[5,4,3]}]},  // L112 Uzun Zincir II —
  {goals:[{level:6,contains:[5,4,3,2]},{level:3,contains:[2,1]}]},  // L113 Uzun Zincir II —
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:2,contains:[1]}]},  // L114 Uzun Zincir II —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:2,contains:[1]}]},  // L115 Uzun Zincir II —
  {goals:[{level:4,contains:[3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L116 Uzun Zincir II —
  {goals:[{level:6,contains:[5,4,3]},{level:4,contains:[3,2,1]},{level:1,contains:[0]}]},  // L117 Uzun Zincir II —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2]}]},  // L118 Uzun Zincir II — boss
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L119 Uzun Zincir II — boss+
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L120 Uzun Zincir II — nefes
  // ── CP 13: Merge Ustası ──────────────────────────────────
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L121 Merge Ustası — giriş
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:1,contains:[0]}]},  // L122 Merge Ustası —
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]},{level:2,contains:[1]}]},  // L123 Merge Ustası —
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},  // L124 Merge Ustası —
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:2,contains:[1]}]},  // L125 Merge Ustası —
  {goals:[{level:6,contains:[5,4,3,2]},{level:6,contains:[5,4,3]}]},  // L126 Merge Ustası —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2]}]},  // L127 Merge Ustası —
  {goals:[{level:6,contains:[5,4,3,2]},{level:6,contains:[5,4,3,2]}]},  // L128 Merge Ustası — boss
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2]}]},  // L129 Merge Ustası — boss+
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L130 Merge Ustası — nefes
  // ── CP 14: Kaos I ──────────────────────────────────
  {goals:[{level:1,contains:[0]},{level:6,contains:[5,4,3,2]}]},  // L131 Kaos I — giriş
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:1,contains:[0]},{level:1,contains:[0]}]},  // L132 Kaos I —
  {goals:[{level:3,contains:[2]},{level:6,contains:[5,4,3,2,1]},{level:3,contains:[2]}]},  // L133 Kaos I —
  {goals:[{level:5,contains:[4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L134 Kaos I —
  {goals:[{level:6,contains:[5,4,3,2]},{level:4,contains:[3,2,1]},{level:2,contains:[1]}]},  // L135 Kaos I —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L136 Kaos I —
  {goals:[{level:6,contains:[5,4,3,2]},{level:6,contains:[5,4,3,2,1]},{level:2,contains:[1]}]},  // L137 Kaos I —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:2,contains:[1]}]},  // L138 Kaos I — boss
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L139 Kaos I — boss+
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L140 Kaos I — nefes
  // ── CP 15: Kaos II ──────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:6,contains:[5,4,3,2,1]}]},  // L141 Kaos II — giriş
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:3,contains:[2]},{level:1,contains:[0]}]},  // L142 Kaos II —
  {goals:[{level:5,contains:[4,3,2,1]},{level:5,contains:[4,3,2]},{level:2,contains:[1]}]},  // L143 Kaos II —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L144 Kaos II —
  {goals:[{level:6,contains:[5,4,3,2]},{level:6,contains:[5,4,3,2]},{level:2,contains:[1]}]},  // L145 Kaos II —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2]},{level:3,contains:[2]}]},  // L146 Kaos II —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L147 Kaos II —
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:2,contains:[1]}]},  // L148 Kaos II — boss
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L149 Kaos II — boss+
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L150 Kaos II — nefes
  // ── CP 16: Zirve I ──────────────────────────────────
  {goals:[{level:5,contains:[4,3,2,1]},{level:3,contains:[2,1]}]},  // L153 Zirve I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L154 Zirve I
  {goals:[{level:5,contains:[4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L155 Zirve I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2,1]},{level:3,contains:[2,1]}]},  // L156 Zirve I
  {goals:[{level:6,contains:[5,4,3,2]},{level:6,contains:[5,4,3,2,1]}]},  // L157 Zirve I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2]},{level:4,contains:[3,2]}]},  // L158 Zirve I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:5,contains:[4,3,2]}]},  // L159 Zirve I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:3,contains:[2,1]}]},  // L160 Zirve I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L161 Zirve I
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L162 Zirve I
  // ── CP 17: Zirve II ──────────────────────────────────
  {goals:[{level:4,contains:[3,2,1]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L163 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L164 Zirve II
  {goals:[{level:5,contains:[4,3,2,1]},{level:4,contains:[3,2,1]},{level:3,contains:[2,1]}]},  // L165 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:2,contains:[1]}]},  // L166 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L167 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L168 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L169 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2]}]},  // L170 Zirve II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L171 Zirve II
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L172 Zirve II
  // ── CP 18: Son Sınav I ──────────────────────────────────
  {goals:[{level:5,contains:[4,3,2,1]},{level:5,contains:[4,3,2]}]},  // L173 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L174 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:3,contains:[2,1]}]},  // L175 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L176 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2,1]}]},  // L177 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L178 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2]}]},  // L179 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L180 Son Sınav I
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L181 Son Sınav I
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L182 Son Sınav I
  // ── CP 19: Son Sınav II ──────────────────────────────────
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:4,contains:[3,2,1]},{level:2,contains:[1]}]},  // L183 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:4,contains:[3,2]}]},  // L184 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:3,contains:[2,1]}]},  // L185 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2]}]},  // L186 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L187 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2]}]},  // L188 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L189 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L190 Son Sınav II
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L191 Son Sınav II
  {goals:[{level:5,contains:[4,3,2]},{level:4,contains:[3,2,1]}]},  // L192 Son Sınav II
  // ── CP 20: Kaos Final ──────────────────────────────────
  {goals:[{level:1,contains:[0]},{level:6,contains:[5,4,3,2,1]},{level:1,contains:[0]}]},  // L193 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:2,contains:[1]}]},  // L194 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]},{level:6,contains:[5,4,3,2]}]},  // L195 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L196 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L197 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L198 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L199 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L200 Kaos Final
  {goals:[{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]},{level:6,contains:[5,4,3,2,1]}]},  // L201 Kaos Final
  {goals:[{level:5,contains:[4,3,2,1]},{level:5,contains:[4,3,2,1]}]},  // L202 Kaos Final
];


export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
