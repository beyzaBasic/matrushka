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

  // ── TUTORIAL (0) ───────────────────────────────────────────────────
  {goals:[{level:2,contains:[1]}]},  // TUT — küçük zincir tanıtımı

  // ── CP 00: Tatlı Uyanış · sphere (L1-10) ──────────────────────────
  {goals:[{level:1,contains:[0]}]},                                                            // L01 giriş
  {goals:[{level:2,contains:[1]}]},                                                            // L02
  {goals:[{level:1,contains:[0]},{level:2,contains:[1]}]},                                     // L03 2 slot
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]}]},                                     // L04 çift
  {goals:[{level:3,contains:[2]},{level:1,contains:[0]}]},                                     // L05 yükseliş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},                                     // L06
  {goals:[{level:3,contains:[2,1]},{level:2,contains:[1]}]},                                   // L07 derin
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]}]},                                   // L08
  {goals:[{level:4,contains:[3]},{level:3,contains:[2,1]}]},                                   // L09 boss
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},                                 // L10 boss

  // ── CP 01: Limon Tarlası · jellybear (L11-20) ─────────────────────
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]}]},                                     // L11 giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},                                     // L12
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},                                     // L13 çift
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]}]},                                   // L14 derin
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},              // L15 3 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},            // L16
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},          // L17 derin
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]},{level:3,contains:[2]}]},            // L18
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},          // L19 boss
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},          // L20 boss

  // ── CP 02: Mercan Ateşi · duck (L21-30) ───────────────────────────
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:2,contains:[1]}]},              // L21 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:3,contains:[2]}]},            // L22
  {goals:[{level:4,contains:[3]},{level:3,contains:[2,1]},{level:3,contains:[2]}]},            // L23
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]},{level:3,contains:[2,1]}]},            // L24 çift 4
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]},{level:3,contains:[2,1]}]},          // L25
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},        // L26 derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},          // L27 yükseliş
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:4,contains:[3]}]},          // L28
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4]},{level:4,contains:[3,2,1]}]},        // L29 boss
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},      // L30 boss

  // ── CP 03: Okyanus Gecesi · matrushka (L31-40) ────────────────────
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]},{level:3,contains:[2,1]}]},            // L31 giriş
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]},{level:4,contains:[3]}]},            // L32
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]},{level:4,contains:[3]}]},          // L33
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},          // L34
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},        // L35 derin
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4]},{level:4,contains:[3,2]}]},          // L36
  {goals:[{level:5,contains:[4,3,2]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},      // L37 derin
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:5,contains:[4]}]},          // L38 üçlü 5
  {goals:[{level:6,contains:[5]},{level:5,contains:[4,3,2]},{level:5,contains:[4,3]}]},        // L39 boss
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3,2]},{level:5,contains:[4,3]}]},      // L40 boss

  // ── CP 04: Kaos · fish (L41-50) ───────────────────────────────────
  {goals:[{level:5,contains:[4]},{level:5,contains:[4]},{level:4,contains:[3,2]}]},            // L41 giriş
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4]},{level:5,contains:[4]}]},            // L42
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:5,contains:[4]}]},          // L43
  {goals:[{level:6,contains:[5]},{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},          // L44
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},        // L45
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5]},{level:5,contains:[4,3,2]}]},        // L46
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},      // L47 derin
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},      // L48
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},    // L49 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]}]},  // L50 final boss
];

export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
