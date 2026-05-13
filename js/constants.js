// ── constants.js ──────────────────────────────────────────────────
import { WORLD_CONFIG } from './world-config.js';
export const TUTORIAL_LEVELS = 1;


export function buildLayout() {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // visualViewport: Android Chrome/Samsung'da browser toolbar'ı hariç gerçek görünen alan
  const vvp = window.visualViewport;
  const CSS_W = vvp ? Math.round(vvp.width)  : window.innerWidth;
  const CSS_H = vvp ? Math.round(vvp.height) : window.innerHeight;
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

  // SCORE_AREA: H'a orantılı, küçük ekranlarda daha kompakt
  const SCORE_AREA = Math.max(Math.round(H * 0.18), Math.min(220, Math.round(H * 0.24)));

  // BTN_PAD: ekran genişliğinin %2.5'i
  const BTN_PAD = Math.max(8, Math.round(MIN_DIM * 0.025));

  // Alt güvenlik payı: safe area + minimum boşluk
  const BTN_BOTTOM_PAD = Math.max(12, safeBot + 8);

  // MAIN_R: dikey alana göre maksimum — form bazlı scale _applyLayout'ta yapılır
  const isPortrait  = W < H;
  const SIDE_PAD    = isPortrait ? Math.max(4, Math.round(16 / 3)) : 16; // portrait: 1/3 küçültüldü
  const maxRbyW     = Math.floor((W - SIDE_PAD * 2) / 2);
  const _R_EST      = Math.floor(Math.min(maxRbyW, (H - SCORE_AREA - BTN_BOTTOM_PAD) / 2 - 2));
  const BTN_H_EST   = Math.round(_R_EST * 0.62 * 0.42);
  const BOTTOM_PAD_BASE = BTN_H_EST + BTN_PAD + BTN_BOTTOM_PAD;
  const BOTTOM_PAD  = isPortrait ? Math.round(BOTTOM_PAD_BASE * 1.5) : BOTTOM_PAD_BASE; // portrait: footer 1.5x
  const MAIN_R      = Math.floor(Math.min(maxRbyW, (H - SCORE_AREA - BOTTOM_PAD) / 2 - 2));
  const CY          = SCORE_AREA + MAIN_R + Math.round((H - SCORE_AREA - BOTTOM_PAD - MAIN_R * 2) / 2);

  const safeTop = (() => {
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden';
      document.body.appendChild(el);
      const v = parseInt(getComputedStyle(el).height) || 0;
      document.body.removeChild(el);
      return Math.max(v, 0);
    } catch(_) { return 0; }
  })();

  return { DPR, CSS_W, CSS_H, W, H, MIN_DIM, CX, CY, MAIN_R, S, SCORE_AREA, BTN_PAD, BTN_BOTTOM_PAD, safeTop };
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

// ── Dinamik level tasarımı — WORLD_CONFIG'den otomatik üretilir ──────
// LEVEL_DEFS artık statik array değil; buildLevelDefs(WORLD_CONFIG) ile üretilir.
// world-config.js'e yeni CP eklemek yeterli — constants.js'e dokunmaya gerek yok.

/**
 * Her CP için 10 level üretir. cp index'i ve toplam CP sayısına göre
 * baseLv (baskın level) ve chain derinliği otomatik ölçeklenir.
 *
 * baseLv: CP ilerledikçe artar. İlk CP'de 2-3, son CP'de 5-6 arası.
 * posIdx 0-9: her level içi pozisyon → slot sayısı, chain, nefes/boss ritmi
 */
function _buildCpLevels(cpIdx, totalCp) {
  const t = totalCp <= 1 ? 0 : cpIdx / (totalCp - 1);
  const baseLv = Math.round(2 + t * 3);   // CP0→2, CP4→5
  const maxLv  = Math.min(6, baseLv + 1);
  const minLv  = Math.max(1, baseLv - 1);
  const isLast = cpIdx >= totalCp - 1;

  const chain = (lv, depth) => {
    const c = [];
    for (let d = 1; d <= depth && lv - d >= 0; d++) c.push(lv - d);
    return { level: lv, contains: c };
  };

  // Tasarım kuralları:
  //   • Aynı leveldaki slotlar birbirinden net farklı (lv veya depth farklı)
  //   • Ardışık iki level aynı slot yapısını tekrar etmez
  //   • Depth 3 (üç iç halka) L9/L10 boss'larında sürpriz olarak girer
  //   • Nefes levelleri (2-slot, düşük depth) baskı sonrası yerleştiriliyor
  //   • 1-slot → 2-slot → 3-slot geçişi her şablonda farklı noktada

  const v = cpIdx % 5;

  if (v === 0) return [
    // A — "Kademeli Tırmanış": temiz çizgi, her adım biraz daha derin
    { goals: [chain(baseLv, 1)] },                                               // L1  — tek halka giriş
    { goals: [chain(baseLv, 2)] },                                               // L2  — tek, içi dolu
    { goals: [chain(baseLv, 1), chain(minLv, 1)] },                             // L3  — 2 slot, farklı renkler
    { goals: [chain(maxLv, 1), chain(baseLv, 2)] },                             // L4  — max giriyor, asimetri
    { goals: [chain(baseLv, 2), chain(minLv, 1)] },                             // L5  — nefes: sol derin sağ hafif
    { goals: [chain(maxLv, 1), chain(baseLv, 1), chain(minLv, 1)] },            // L6  — 3 slot, hepsi sığ
    { goals: [chain(maxLv, 2), chain(baseLv, 1), chain(minLv, 1)] },            // L7  — sol derinleşir
    { goals: [chain(maxLv, 1), chain(baseLv, 2), chain(minLv, 2)] },            // L8  — sağ ağırlaşır
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(minLv, 1)] },            // L9  — boss: iki derin
    { goals: [chain(maxLv, 3), chain(baseLv, 2), chain(minLv, isLast?3:2)] },   // L10 — final: max depth 3!
  ];

  if (v === 1) return [
    // B — "Sürpriz Sol": nefes sağda, ağırlık sola birikir; ortada 1-slot twist
    { goals: [chain(baseLv, 1)] },                                               // L1  — giriş
    { goals: [chain(minLv, 1), chain(baseLv, 1)] },                             // L2  — min tanıtımı
    { goals: [chain(baseLv, 2)] },                                               // L3  — 1-slot nefes, ama derin
    { goals: [chain(minLv, 2), chain(baseLv, 1)] },                             // L4  — min derinleşir
    { goals: [chain(baseLv, 1), chain(maxLv, 1)] },                             // L5  — max giriyor sağdan
    { goals: [chain(minLv, 1), chain(baseLv, 2), chain(maxLv, 1)] },            // L6  — 3 slot: orta derin
    { goals: [chain(baseLv, 1), chain(maxLv, 2), chain(minLv, 1)] },            // L7  — max derinleşir ortada
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(minLv, 2)] },            // L8  — hepsi depth 2
    { goals: [chain(maxLv, 2), chain(maxLv, 1), chain(baseLv, 2)] },            // L9  — boss: çift max
    { goals: [chain(maxLv, isLast?3:2), chain(maxLv, 2), chain(baseLv, 2)] },   // L10 — final boss
  ];

  if (v === 2) return [
    // C — "Erken Üçlü": L3'te 3 slot sürprizi, sonra 2-slot nefes, tekrar tırmanış
    { goals: [chain(baseLv, 1)] },                                               // L1  — tek
    { goals: [chain(baseLv, 1), chain(minLv, 1)] },                             // L2  — 2 slot hızlı
    { goals: [chain(minLv, 1), chain(baseLv, 1), chain(maxLv, 1)] },            // L3  — 3 slot sürpriz, hepsi sığ!
    { goals: [chain(baseLv, 2), chain(minLv, 1)] },                             // L4  — 2 slot nefes
    { goals: [chain(maxLv, 1), chain(baseLv, 2)] },                             // L5  — max+derin combo
    { goals: [chain(minLv, 2), chain(baseLv, 1), chain(maxLv, 1)] },            // L6  — 3 slot: sol derinleşti
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(minLv, 1)] },            // L7  — iki derin
    { goals: [chain(minLv, 2), chain(maxLv, 2), chain(baseLv, 1)] },            // L8  — kanatlar derin, merkez nefes
    { goals: [chain(maxLv, 3), chain(minLv, 2), chain(baseLv, 1)] },            // L9  — boss: depth 3 ilk kez!
    { goals: [chain(maxLv, 3), chain(baseLv, isLast?3:2), chain(minLv, 2)] },   // L10 — final
  ];

  if (v === 3) return [
    // D — "Dalgalı Nefes": zorluk bilinçli dalgalı — tırman, nefes, tekrar
    { goals: [chain(baseLv, 2)] },                                               // L1  — baştan derin, tek
    { goals: [chain(baseLv, 1), chain(minLv, 1)] },                             // L2  — nefes
    { goals: [chain(maxLv, 1), chain(baseLv, 1)] },                             // L3  — surge: max giriyor
    { goals: [chain(minLv, 2), chain(maxLv, 1)] },                              // L4  — min derinleşir
    { goals: [chain(baseLv, 1), chain(minLv, 1), chain(maxLv, 1)] },            // L5  — 3 slot, hepsi sığ
    { goals: [chain(maxLv, 2), chain(baseLv, 1), chain(minLv, 1)] },            // L6  — sol ağırlaşır
    { goals: [chain(baseLv, 1), chain(maxLv, 1), chain(minLv, 2)] },            // L7  — nefes dalgası: sağ derinleşir
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(minLv, 2)] },            // L8  — hepsi depth 2, tepe
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(maxLv, 1)] },            // L9  — boss
    { goals: [chain(maxLv, isLast?3:2), chain(baseLv, 2), chain(minLv, 2)] },   // L10 — final
  ];

  // v === 4
  return [
    // E — "Geç Patlama": base atlayarak başlar, son 4 levelde patlama
    { goals: [chain(baseLv, 1)] },                                               // L1  — tek
    { goals: [chain(minLv, 1), chain(maxLv, 1)] },                              // L2  — base yok! renk kontrast
    { goals: [chain(baseLv, 2)] },                                               // L3  — 1-slot derin öğret
    { goals: [chain(baseLv, 1), chain(maxLv, 1)] },                             // L4  — 2 slot: max kalır
    { goals: [chain(minLv, 1), chain(baseLv, 2), chain(maxLv, 1)] },            // L5  — 3 slot giriş: orta derin
    { goals: [chain(baseLv, 2), chain(minLv, 1), chain(maxLv, 2)] },            // L6  — kanatlar derinleşir
    { goals: [chain(maxLv, 1), chain(baseLv, 1), chain(minLv, 2)] },            // L7  — nefes: sağ sürpriz
    { goals: [chain(maxLv, 2), chain(minLv, 2), chain(baseLv, 2)] },            // L8  — hepsi depth 2
    { goals: [chain(maxLv, 3), chain(baseLv, 1), chain(minLv, 2)] },            // L9  — boss: max depth 3, kontrast
    { goals: [chain(maxLv, isLast?3:2), chain(baseLv, 2), chain(minLv, isLast?3:2)] }, // L10 — final
  ];
}

/**
 * WORLD_CONFIG import ederek tüm LEVEL_DEFS'i üretir.
 * Tutorial entry'si başa otomatik eklenir.
 */
function _buildLevelDefs() {
  const totalCp = WORLD_CONFIG.length;
  const defs = [
    // Tutorial (internal level 0)
    { goals: [{ level: 2, contains: [1] }] },
  ];
  for (let cp = 0; cp < totalCp; cp++) {
    const cpLevels = _buildCpLevels(cp, totalCp);
    for (const lv of cpLevels) defs.push(lv);
  }
  return defs;
}

export const LEVEL_DEFS = _buildLevelDefs();

// ── Magic Numbers ────────────────────────────────────────────────────
export const PHYSICS_CONSTANTS = {
  SPAWN_PADDING: 4,                    // spawn top padding
  BEAR_RADIUS_FACTOR: 0.90,           // bear collision radius
  JELLYBEAR_RADIUS_FACTOR: 0.90,      // jellybear collision radius
  MATRUSHKA_RADIUS_FACTOR: 0.82,      // matrushka collision radius
  DUCK_RADIUS_FACTOR: 0.88,           // duck collision radius
  DUCK_OFFSET_X: 0.10,                // duck x offset
  DUCK_OFFSET_Y: -0.10,               // duck y offset
  FISH_RADIUS_FACTOR: 1.00,           // fish collision radius
  FISH_COLLISION_OFFSET_X: -0.10,     // fish x offset
  BEAR_OFFSET_Y: 0.05,                // bear y offset
  ZERO_DIVISION_GUARD: 0.001,         // guard for hypot zero
};

export const RENDER_CONSTANTS = {
  COLOR_SHADE_CACHE_LIMIT: 512,       // max cached color shades
  CACHE_PADDING_RATIO: 0.25,          // shape cache padding factor
  ELLIPSE_CONSTANT: 0.5523,           // bezier constant for ellipse
  DPR_MAX: 2,                         // max device pixel ratio
  SQUISH_THRESHOLD: 0.01,             // squish animation threshold
  BOING_THRESHOLD: 0.05,              // boing animation threshold
  SHAPE_CACHE_LIMIT: 200,             // max cached shapes
  CACHE_LRU_REMOVE_COUNT: 1,          // shapes to remove when cache full
};

export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
