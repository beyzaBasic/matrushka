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

  const safeTop = (() => {
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden';
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

  // MAIN_R: mevcut alanı blast button için yer bırakarak hesapla
  const _R_EST       = Math.floor(Math.min(W * 0.46, (H - SCORE_AREA - BTN_BOTTOM_PAD) / 2 - 2));
  const BTN_H_EST    = Math.round(_R_EST * 0.62 * 0.42);
  const BOTTOM_PAD   = BTN_H_EST + BTN_PAD + BTN_BOTTOM_PAD;
  const MAIN_R       = Math.floor(Math.min(W * 0.46, (H - SCORE_AREA - BOTTOM_PAD) / 2 - 2));
  const CY           = SCORE_AREA + MAIN_R + Math.round((H - SCORE_AREA - BOTTOM_PAD - MAIN_R * 2) / 2);

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

  // Her CP için farklı 10-level akışı — cpIdx % 5 ile 5 farklı şablon
  // Ortak kurallar:
  //   L1-2: 1 slot giriş           (yavaş başla)
  //   L3-5: 2 slot tırmanış        (oyuncu ısındı)
  //   L6-8: 3 slot baskı           (asıl zorluk)
  //   L9-10: boss                  (CP finali)
  // Şablonlar bu çerçeve içinde farklı chain derinliği ve slot sırası kullanır.

  const v = cpIdx % 5;
  if (v === 0) return [
    // Şablon A — "Kademeli Tırmanış": her level bir öncekinden biraz daha derin
    { goals: [chain(baseLv, 1)] },                                                // L1 — giriş
    { goals: [chain(baseLv, 2)] },                                                // L2 — basit, nefes
    { goals: [chain(baseLv, 1), chain(minLv, 1)] },                              // L3 — asimetrik 2slot
    { goals: [chain(baseLv, 2), chain(minLv, 1)] },                              // L4 — sol derin
    { goals: [chain(baseLv, 1), chain(baseLv, 2)] },                             // L5 — sağ derin
    { goals: [chain(maxLv, 1), chain(baseLv, 1), chain(minLv, 1)] },             // L6 — 3slot giriş
    { goals: [chain(maxLv, 1), chain(baseLv, 2), chain(baseLv, 1)] },            // L7 — orta derin
    { goals: [chain(maxLv, 1), chain(baseLv, 1), chain(baseLv, 2)] },            // L8 — sağ ağır
    { goals: [chain(maxLv, 2), chain(maxLv, 1), chain(baseLv, 2)] },             // L9 — boss giriş
    { goals: [chain(maxLv, 2), chain(baseLv, isLast?3:2), chain(baseLv, 2)] },   // L10 — final boss
  ];

  if (v === 1) return [
    // Şablon B — "Sürpriz Sağ": ağır slot sağda, sol nefes
    { goals: [chain(baseLv, 1)] },                                                // L1 — tek, hafif
    { goals: [chain(baseLv, 2)] },                                                // L2 — tek, derin
    { goals: [chain(minLv, 1), chain(baseLv, 1)] },                              // L3 — sol hafif sağ ağır
    { goals: [chain(baseLv, 1), chain(baseLv, 1)] },                             // L4 — çift aynı
    { goals: [chain(baseLv, 1), chain(maxLv, 1)] },                              // L5 — sağ yükseliş
    { goals: [chain(baseLv, 1), chain(maxLv, 1), chain(minLv, 1)] },             // L6 — 3slot, orta zirve
    { goals: [chain(baseLv, 2), chain(maxLv, 1), chain(baseLv, 1)] },            // L7 — sol derin
    { goals: [chain(baseLv, 1), chain(maxLv, 2), chain(baseLv, 1)] },            // L8 — orta derin
    { goals: [chain(maxLv, 1), chain(maxLv, 2), chain(baseLv, 2)] },             // L9 — boss, sağ ağır
    { goals: [chain(maxLv, 2), chain(maxLv, isLast?3:2), chain(baseLv, 2)] },    // L10 — final boss
  ];

  if (v === 2) return [
    // Şablon C — "Üçlü Vurgu": 3 slot erken giriyor, ama hafif başlar
    { goals: [chain(baseLv, 1)] },                                                // L1
    { goals: [chain(minLv, 1), chain(baseLv, 1)] },                              // L2 — 2slot erken
    { goals: [chain(baseLv, 1), chain(baseLv, 2), chain(minLv, 1)] },            // L3 — 3slot giriş hafif
    { goals: [chain(baseLv, 2), chain(baseLv, 1), chain(minLv, 1)] },            // L4 — sol derin
    { goals: [chain(baseLv, 1), chain(baseLv, 2), chain(minLv, 1)] },            // L5 — orta derin
    { goals: [chain(baseLv, 2), chain(baseLv, 1), chain(baseLv, 2)] },           // L6 — nefes yok, simetrik
    { goals: [chain(maxLv, 1), chain(baseLv, 2), chain(baseLv, 2)] },            // L7 — sol zirve
    { goals: [chain(baseLv, 2), chain(maxLv, 1), chain(baseLv, 2)] },            // L8 — orta zirve
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(maxLv, 1)] },             // L9 — boss, köşegen
    { goals: [chain(maxLv, 2), chain(maxLv, isLast?3:2), chain(maxLv, 2)] },     // L10 — final boss üçlü
  ];

  if (v === 3) return [
    // Şablon D — "Dalgalı Nefes": zorluğu dalgalı tut, nefes slotları beklenmedik yerde
    { goals: [chain(baseLv, 2)] },                                                // L1 — erken derin, tek slot
    { goals: [chain(minLv, 1), chain(baseLv, 1)] },                              // L2 — nefes sol
    { goals: [chain(baseLv, 2), chain(baseLv, 1)] },                             // L3 — sol derin tekrar
    { goals: [chain(baseLv, 1), chain(minLv, 1)] },                              // L4 — nefes sağ
    { goals: [chain(maxLv, 1), chain(baseLv, 2)] },                              // L5 — ani yükseliş
    { goals: [chain(baseLv, 2), chain(minLv, 1), chain(baseLv, 1)] },            // L6 — 3slot, orta nefes
    { goals: [chain(maxLv, 1), chain(baseLv, 1), chain(minLv, 1)] },             // L7 — nefes sağa itti
    { goals: [chain(maxLv, 2), chain(baseLv, 2), chain(baseLv, 1)] },            // L8 — sol ağır
    { goals: [chain(maxLv, 2), chain(baseLv, 1), chain(maxLv, 1)] },             // L9 — boss köşegen
    { goals: [chain(maxLv, isLast?3:2), chain(maxLv, 2), chain(baseLv, 2)] },    // L10 — final boss
  ];

  // v === 4
  return [
    // Şablon E — "Büyüyen Baskı": 2. yarıda hızlı tırmanış, boss çok ağır
    { goals: [chain(baseLv, 1)] },                                                // L1 — en basit giriş
    { goals: [chain(baseLv, 2)] },                                                // L2
    { goals: [chain(baseLv, 1), chain(baseLv, 1)] },                             // L3 — çift aynı
    { goals: [chain(baseLv, 2), chain(baseLv, 3)] },                             // L4 — sol derin sağ hafif
    { goals: [chain(maxLv, 1), chain(baseLv, 1)] },                              // L5 — ani zirve
    { goals: [chain(maxLv, 1), chain(baseLv, 2), chain(minLv, 1)] },             // L6 — 3slot, sağ nefes
    { goals: [chain(maxLv, 2), chain(baseLv, 1), chain(baseLv, 1)] },            // L7 — sol ağır
    { goals: [chain(maxLv, 1), chain(maxLv, 2), chain(baseLv, 2)] },             // L8 — çift maxLv
    { goals: [chain(maxLv, 2), chain(maxLv, 1), chain(maxLv, 2)] },              // L9 — boss simetrik ağır
    { goals: [chain(maxLv, isLast?3:2), chain(maxLv, 2), chain(maxLv, isLast?3:2)] }, // L10 — final boss
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

export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
