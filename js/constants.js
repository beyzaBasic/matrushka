// ── constants.js ──────────────────────────────────────────────────
import { WORLD_CONFIG, CONTAINER_FORMS } from './world-config.js';
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
  const SIDE_PAD    = isPortrait ? 8 : 16;
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

// ── Level tasarımı ────────────────────────────────────────────────
//
// Her level def: { goals, containerForm }
//   goals[i] = { level: N, contains: [N-1, N-2, ...] }
//     level    = slotun beklediği en büyük top boyutu (0–6)
//     contains = içinde bulunması gereken daha küçük boyutlar (iç halkalar)
//   containerForm = o levele özel kap şekli (CP varsayılanını override eder)
//
// HYPERCASUAL ARC (10 level = 1 CP):
//   L01 HOOK    1 slot, 0 iç halka — anında kazandır
//   L02 LEARN   1 slot, 1 iç halka — konsept tanıtımı
//   L03 APPLY   2 slot, flat       — öğrendiklerini kullan
//   L04 TWIST   2 slot, asimetrik  — sol/sağ derinlik farkı
//   L05 RELIEF  1 slot             — nefes al
//   L06 SPIKE   3 slot             — şok dalgası!
//   L07 SETTLE  2 slot, orta       — spikeı sindir
//   L08 BUILD   3 slot, 2 nested   — boss tırmanışı
//   L09 BOSS    3 slot, depth-2    — CP'nin zirvesi
//   L10 FINALE  3-4 slot, max depth — hak edilmiş kapanış
//
// SLOT SAYISI: CP ilerledikçe 3-slot daha erken girer; CP3'ten 4-slot eklenur.
// DEPTH: Her CP'de depth-2 L09'da standart; depth-3 L10'dan CP3'te L09'a iner.
// CONTAINER FORM: basit levellerde classicU/roundBowl,
//                 spike/boss'ta tallNarrow/goblet, finale'de vase.

function _buildCpLevels(cpIdx, _totalCp) {
  const CF = CONTAINER_FORMS;
  const c = (lv, depth) => {
    const contains = [];
    const minDepth = Math.max(1, depth); // slot asla tek renk olamaz
    for (let d = 1; d <= minDepth && lv - d >= 0; d++) contains.push(lv - d);
    return { level: lv, contains };
  };

  // ── CP 0: Öğrenme — Boyutlar 1–4, max depth 2 ───────────────────
  if (cpIdx === 0) return [
    { goals: [c(3,0)],                          containerForm: CF.classicU   }, // L01 HOOK   tek düz top
    { goals: [c(3,1)],                          containerForm: CF.classicU   }, // L02 LEARN  ilk iç halka
    { goals: [c(4,0), c(2,0)],                 containerForm: CF.roundBowl  }, // L03 APPLY  2 slot, flat
    { goals: [c(4,1), c(2,0)],                 containerForm: CF.classicU   }, // L04 TWIST  sol nested, sağ flat
    { goals: [c(3,1)],                          containerForm: CF.roundBowl  }, // L05 RELIEF 1 slot nefes
    { goals: [c(4,0), c(3,1), c(2,0)],         containerForm: CF.tallNarrow }, // L06 SPIKE  3 slot!
    { goals: [c(4,1), c(2,0)],                 containerForm: CF.classicU   }, // L07 SETTLE 2 slot
    { goals: [c(4,1), c(3,1), c(2,0)],         containerForm: CF.goblet     }, // L08 BUILD  3 slot, 2 nested
    { goals: [c(4,2), c(3,1), c(2,0)],         containerForm: CF.goblet     }, // L09 BOSS   depth 2 giriyor
    { goals: [c(4,2), c(3,1), c(2,1)],         containerForm: CF.vase       }, // L10 FINALE tüm slotlar nested
  ];

  // ── CP 1: Tırmanış — Boyutlar 2–5, depth 2 normal hale gelir ────
  if (cpIdx === 1) return [
    { goals: [c(4,1)],                          containerForm: CF.classicU   }, // L01 HOOK   nested single
    { goals: [c(5,0), c(3,0)],                 containerForm: CF.roundBowl  }, // L02 LEARN  2 slot, boyut 5 giriyor
    { goals: [c(5,1), c(3,0)],                 containerForm: CF.classicU   }, // L03 APPLY  sol nested
    { goals: [c(5,0), c(3,1)],                 containerForm: CF.classicU   }, // L04 TWIST  sağ nested
    { goals: [c(4,1)],                          containerForm: CF.roundBowl  }, // L05 RELIEF 1 slot
    { goals: [c(5,0), c(4,0), c(2,0)],         containerForm: CF.tallNarrow }, // L06 SPIKE  3 slot, dar kap
    { goals: [c(5,1), c(3,0)],                 containerForm: CF.classicU   }, // L07 SETTLE 2 slot
    { goals: [c(5,1), c(4,1), c(2,0)],         containerForm: CF.goblet     }, // L08 BUILD  3 slot, 2 nested
    { goals: [c(5,2), c(4,1), c(2,0)],         containerForm: CF.goblet     }, // L09 BOSS   depth 2
    { goals: [c(5,2), c(4,2), c(2,1)],         containerForm: CF.vase       }, // L10 FINALE tüm slotlar derin
  ];

  // ── CP 2: Fırtına — Boyutlar 2–6, 3 slot standart, depth 3 finale ─
  if (cpIdx === 2) return [
    { goals: [c(5,1), c(3,0)],                 containerForm: CF.classicU   }, // L01 HOOK   2 slot, nested
    { goals: [c(6,0), c(4,0)],                 containerForm: CF.roundBowl  }, // L02 LEARN  boyut 6 sürpriz!
    { goals: [c(6,0), c(4,0), c(2,0)],         containerForm: CF.roundBowl  }, // L03 SPIKE  erken 3 slot!
    { goals: [c(5,1), c(3,1)],                 containerForm: CF.classicU   }, // L04 RELIEF 2 slot nefes
    { goals: [c(6,1), c(4,1)],                 containerForm: CF.tallNarrow }, // L05 APPLY  2 slot, ikisi nested
    { goals: [c(6,1), c(4,1), c(2,0)],         containerForm: CF.tallNarrow }, // L06 SPIKE  3 slot, 2 nested
    { goals: [c(6,2), c(4,0), c(2,0)],         containerForm: CF.goblet     }, // L07 TWIST  depth 2 giriyor
    { goals: [c(6,1), c(5,1), c(4,1)],         containerForm: CF.goblet     }, // L08 BUILD  dar aralık, tümü nested
    { goals: [c(6,2), c(5,1), c(3,1)],         containerForm: CF.vase       }, // L09 BOSS   vazo + depth 2
    { goals: [c(6,3), c(5,1), c(4,1), c(2,0)], containerForm: CF.vase       }, // L10 FINALE depth 3 + 4 slot!
  ];

  // ── CP 3: Derinlik — Boyutlar 3–6, 4 slot L08'de, depth 3 boss ──
  if (cpIdx === 3) return [
    { goals: [c(6,1), c(4,0)],                 containerForm: CF.classicU   }, // L01 HOOK   2 slot
    { goals: [c(6,1), c(4,1), c(3,0)],         containerForm: CF.roundBowl  }, // L02 LEARN  3 slot hızlı
    { goals: [c(6,2), c(4,0)],                 containerForm: CF.tallNarrow }, // L03 TWIST  depth 2, 2 slot
    { goals: [c(6,1), c(5,1), c(3,0)],         containerForm: CF.goblet     }, // L04 APPLY  dar boyut aralığı
    { goals: [c(6,1), c(4,1)],                 containerForm: CF.classicU   }, // L05 RELIEF 2 slot
    { goals: [c(6,2), c(5,1), c(3,0)],         containerForm: CF.tallNarrow }, // L06 SPIKE  depth 2 + dar kap
    { goals: [c(6,2), c(5,1), c(4,1)],         containerForm: CF.goblet     }, // L07 BUILD  3 slot, dar aralık
    { goals: [c(6,2), c(5,1), c(4,1), c(3,0)], containerForm: CF.goblet     }, // L08 SURGE  4 SLOT ilk kez!
    { goals: [c(6,3), c(5,1), c(4,1), c(3,0)], containerForm: CF.vase       }, // L09 BOSS   depth 3!
    { goals: [c(6,3), c(5,2), c(4,1), c(3,1)], containerForm: CF.vase       }, // L10 FINALE maksimum
  ];

  // ── CP 4: Endgame — 4 slot standart, depth 3 çoklu slot ─────────
  return [
    { goals: [c(6,2), c(4,1)],                 containerForm: CF.classicU   }, // L01 HOOK   biraz nefes
    { goals: [c(6,2), c(5,1), c(3,0)],         containerForm: CF.tallNarrow }, // L02 LEARN  3 slot hızlı
    { goals: [c(6,1), c(5,2), c(4,0)],         containerForm: CF.goblet     }, // L03 TWIST  depth yeri değişti
    { goals: [c(6,2), c(5,1), c(4,1), c(3,0)], containerForm: CF.roundBowl  }, // L04 APPLY  4 slot artık normal
    { goals: [c(6,1), c(5,1)],                 containerForm: CF.classicU   }, // L05 RELIEF 2 slot
    { goals: [c(6,2), c(5,2), c(4,1), c(3,0)], containerForm: CF.tallNarrow }, // L06 SPIKE  4 slot + 2×depth2
    { goals: [c(6,3), c(5,1), c(4,0)],         containerForm: CF.goblet     }, // L07 TWIST  depth 3! 3 slot
    { goals: [c(6,2), c(5,2), c(4,2), c(3,0)], containerForm: CF.goblet     }, // L08 BUILD  4 slot, hepsi derin
    { goals: [c(6,3), c(5,2), c(4,1), c(3,1)], containerForm: CF.vase       }, // L09 BOSS   maksimum kaos
    { goals: [c(6,3), c(5,2), c(4,2), c(3,1)], containerForm: CF.vase       }, // L10 FINALE ultimate
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
