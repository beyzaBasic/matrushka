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
  // depth her zaman ≥ 1: her slot en az bir absorb gerektirir
  // Maksimum depth = lv (c(6,6) = 6→5→4→3→2→1→0 = 7 katman)
  const c = (lv, depth) => {
    const contains = [];
    for (let d = 1; d <= depth && lv - d >= 0; d++) contains.push(lv - d);
    return { level: lv, contains };
  };

  // ── CP 0: Giriş — seviyeler 2–4, derinlik 1–3, küçük toplar tanıtılıyor ──
  if (cpIdx === 0) return [
    { goals: [c(3,1)],                          containerForm: CF.classicU   }, // L01 HOOK   3→2, tek slot
    { goals: [c(4,1), c(3,1)],                  containerForm: CF.roundBowl  }, // L02 LEARN  2 slot, sığ
    { goals: [c(4,2)],                           containerForm: CF.classicU   }, // L03 APPLY  4→3→2, derinleşiyor
    { goals: [c(4,1), c(2,2)],                  containerForm: CF.classicU   }, // L04 TWIST  büyük+küçük derin (c(2,2)=2→1→0)
    { goals: [c(3,2)],                           containerForm: CF.roundBowl  }, // L05 RELIEF 3→2→1, nefes
    { goals: [c(4,2), c(3,2)],                  containerForm: CF.tallNarrow }, // L06 SPIKE  her ikisi depth-2
    { goals: [c(4,2), c(3,1)],                  containerForm: CF.classicU   }, // L07 SETTLE spike'tan iniş
    { goals: [c(4,3), c(3,1)],                  containerForm: CF.goblet     }, // L08 BUILD  depth-3 ilk kez! (4→3→2→1)
    { goals: [c(4,3), c(3,2), c(2,2)],         containerForm: CF.goblet     }, // L09 BOSS   3 slot, küçük derin
    { goals: [c(4,3), c(3,3), c(2,2)],         containerForm: CF.vase       }, // L10 FINALE c(3,3)=3→2→1→0
  ];

  // ── CP 1: Tırmanış — seviyeler 2–5, derinlik 1–4, karışık boyutlar ──────
  if (cpIdx === 1) return [
    { goals: [c(5,1)],                           containerForm: CF.classicU   }, // L01 HOOK   5 giriyor
    { goals: [c(5,2), c(3,1)],                  containerForm: CF.roundBowl  }, // L02 LEARN  büyük derin + küçük sığ
    { goals: [c(5,1), c(4,2)],                  containerForm: CF.classicU   }, // L03 APPLY  sığ büyük + derin orta
    { goals: [c(4,3)],                           containerForm: CF.classicU   }, // L04 TWIST  4→3→2→1 tek slot
    { goals: [c(5,2), c(2,2)],                  containerForm: CF.roundBowl  }, // L05 RELIEF büyük + çok küçük derin
    { goals: [c(5,2), c(4,2), c(3,1)],         containerForm: CF.tallNarrow }, // L06 SPIKE  3 slot
    { goals: [c(5,3), c(3,2)],                  containerForm: CF.classicU   }, // L07 SETTLE depth-3 büyük + orta
    { goals: [c(5,3), c(4,2), c(3,1)],         containerForm: CF.goblet     }, // L08 BUILD  3 slot kademeli
    { goals: [c(5,3), c(4,3), c(2,2)],         containerForm: CF.goblet     }, // L09 BOSS   tümü derin
    { goals: [c(5,4), c(4,3), c(3,2), c(2,2)], containerForm: CF.vase       }, // L10 FINALE 4 slot! c(5,4)=5→4→3→2→1
  ];

  // ── CP 2: Fırtına — seviyeler 2–6, derinlik 1–4, kontrast kombinasyonlar ─
  if (cpIdx === 2) return [
    { goals: [c(6,1), c(4,2)],                  containerForm: CF.classicU   }, // L01 HOOK   6 giriyor + derin orta
    { goals: [c(6,2), c(4,1)],                  containerForm: CF.roundBowl  }, // L02 LEARN  derin büyük + sığ orta
    { goals: [c(6,2), c(5,1), c(3,2)],         containerForm: CF.classicU   }, // L03 APPLY  3 slot, çeşitli
    { goals: [c(5,4), c(2,2)],                  containerForm: CF.tallNarrow }, // L04 TWIST  5→4→3→2→1 + 2→1→0 (derin zıtlık)
    { goals: [c(6,1), c(5,2)],                  containerForm: CF.roundBowl  }, // L05 RELIEF 2 slot, nefes
    { goals: [c(6,3), c(4,2), c(2,2)],         containerForm: CF.tallNarrow }, // L06 SPIKE  depth-3 büyük + küçük derin
    { goals: [c(6,2), c(5,2), c(3,1)],         containerForm: CF.classicU   }, // L07 SETTLE settle
    { goals: [c(6,3), c(5,2), c(4,1)],         containerForm: CF.goblet     }, // L08 BUILD  3 slot kademeli depth
    { goals: [c(6,4), c(5,2), c(3,2)],         containerForm: CF.goblet     }, // L09 BOSS   depth-4 ilk kez!
    { goals: [c(6,3), c(5,3), c(4,2), c(2,2)], containerForm: CF.vase       }, // L10 FINALE 4 slot, küçük derin dahil
  ];

  // ── CP 3: Derinlik — seviyeler 2–6, derinlik 2–5, küçük derin artıyor ───
  if (cpIdx === 3) return [
    { goals: [c(6,3), c(4,3)],                  containerForm: CF.classicU   }, // L01 HOOK   her ikisi depth-3
    { goals: [c(6,2), c(5,3), c(3,2)],         containerForm: CF.roundBowl  }, // L02 LEARN  3 slot
    { goals: [c(5,4), c(4,3)],                  containerForm: CF.classicU   }, // L03 APPLY  5→4→3→2→1 + 4→3→2→1
    { goals: [c(6,4), c(3,3)],                  containerForm: CF.tallNarrow }, // L04 TWIST  büyük max + küçük full stack (3→2→1→0)
    { goals: [c(6,2), c(5,2)],                  containerForm: CF.roundBowl  }, // L05 RELIEF 2 slot, nefes
    { goals: [c(6,4), c(5,3), c(3,3)],         containerForm: CF.tallNarrow }, // L06 SPIKE  3 slot, tümü derin
    { goals: [c(6,3), c(5,3), c(4,2)],         containerForm: CF.goblet     }, // L07 SETTLE kademeli
    { goals: [c(6,4), c(5,3), c(4,2), c(2,2)], containerForm: CF.goblet     }, // L08 BUILD  4 slot
    { goals: [c(6,5), c(5,3), c(3,3)],         containerForm: CF.vase       }, // L09 BOSS   depth-5! 6→5→4→3→2→1
    { goals: [c(6,4), c(5,4), c(4,3), c(3,3)], containerForm: CF.vase       }, // L10 FINALE 4 slot tümü derin
  ];

  // ── CP 4: Endgame — derinlik 3–6, küçük full stack + maksimum ───────────
  return [
    { goals: [c(6,3), c(5,4)],                  containerForm: CF.classicU   }, // L01 HOOK   depth-3+4, giriş
    { goals: [c(6,4), c(5,3), c(3,3)],         containerForm: CF.roundBowl  }, // L02 LEARN  3 slot
    { goals: [c(6,5), c(4,3)],                  containerForm: CF.classicU   }, // L03 APPLY  6→5→4→3→2→1 (5 derin!)
    { goals: [c(5,5), c(3,3)],                  containerForm: CF.tallNarrow }, // L04 TWIST  5→4→3→2→1→0 + 3→2→1→0
    { goals: [c(6,3), c(5,3)],                  containerForm: CF.roundBowl  }, // L05 RELIEF 2 slot, nefes
    { goals: [c(6,4), c(5,5), c(3,3)],         containerForm: CF.tallNarrow }, // L06 SPIKE  c(5,5) full stack!
    { goals: [c(6,5), c(5,4), c(4,3)],         containerForm: CF.goblet     }, // L07 SETTLE 3 slot derin
    { goals: [c(6,5), c(5,4), c(4,4), c(3,2)], containerForm: CF.goblet     }, // L08 BUILD  4 slot
    { goals: [c(6,6), c(5,4), c(4,3)],         containerForm: CF.vase       }, // L09 BOSS   c(6,6)=6→5→4→3→2→1→0 MAXIMUM!
    { goals: [c(6,5), c(5,5), c(4,4), c(3,3)], containerForm: CF.vase       }, // L10 FINALE 4 slot, tümü full stack
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

  // Duplicate & depth-0 kontrolü (dev-time)
  const seen = new Set();
  for (let i = 1; i < defs.length; i++) {
    const d = defs[i];
    for (const g of d.goals) {
      if (g.contains.length === 0) console.warn(`[levels] L${i}: depth-0 slot c(${g.level})`);
    }
    const slotKeys = d.goals.map(g => `${g.level}:${g.contains.join(',')}`);
    const uniqueSlots = new Set(slotKeys);
    if (uniqueSlots.size !== slotKeys.length) console.warn(`[levels] L${i}: duplicate slot`);
    const key = [...slotKeys].sort().join('|');
    if (seen.has(key)) console.warn(`[levels] L${i}: duplicate level — ${key}`);
    seen.add(key);
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
