// ── constants.js ──────────────────────────────────────────────────
export const TUTORIAL_LEVELS = 2;

export function buildLayout() {
  const DPR = window.devicePixelRatio || 1;
  const CSS_W = window.innerWidth, CSS_H = window.innerHeight;
  const W = CSS_W, H = CSS_H, MIN_DIM = Math.min(W, H), CX = W / 2;
  const SCORE_AREA = 230, BTN_PAD = 12, BTN_BOTTOM_PAD = 12;
  const _R_EST = Math.floor(Math.min(W * 0.49, (H - SCORE_AREA) / 2 - 2));
  const BTN_H_EST = Math.round(_R_EST * 0.62 * 0.42);
  const BOTTOM_PAD = BTN_H_EST + BTN_PAD + BTN_BOTTOM_PAD;
  const MAIN_R = Math.floor(Math.min(W * 0.49, (H - SCORE_AREA - BOTTOM_PAD) / 2 - 2));
  const CY = SCORE_AREA + MAIN_R + Math.round((H - SCORE_AREA - BOTTOM_PAD - MAIN_R * 2) / 2);
  const S = MIN_DIM / 800;
  return { DPR, CSS_W, CSS_H, W, H, MIN_DIM, CX, CY, MAIN_R, S, SCORE_AREA, BTN_PAD, BTN_BOTTOM_PAD };
}

// Boyut oranları — renkten bağımsız, değişmez
const LEVEL_RATIOS = [
  { ratio: 28 / 360, vy: 1.4 },
  { ratio: 38 / 360, vy: 1.8 },
  { ratio: 51 / 360, vy: 2.2 },
  { ratio: 68 / 360, vy: 2.7 },
  { ratio: 90 / 360, vy: 3.2 },
  { ratio: 120 / 360, vy: 3.8 },
  { ratio: 160 / 360, vy: 4.5 },
];

/**
 * palette: world-config'den gelen 8 renk dizisi.
 * 7 level için palette'in ilk 7 rengi kullanılır (index 0-6).
 * palette verilmezse eski hardcoded renkler fallback olarak çalışır.
 */
export function buildLevels(MAIN_R, palette) {
  const fallback = ['#FF5EBC','#FFD700','#FF9500','#00C853','#00B0FF','#AA00FF','#FF1744'];
  const colors = (palette && palette.length >= 7) ? palette : fallback;
  return LEVEL_RATIOS.map((lv, i) => ({
    r: Math.round(MAIN_R * lv.ratio),
    color: colors[i],
    vy: lv.vy,
  }));
}

export const LEVEL_DEFS = [
  // ── TUTORIAL (0-1) ──────────────────────────────────────────────
  {goals:[{level:3,contains:[2,1]}]},                                              // 0
  {goals:[{level:2,contains:[1,0]}]},                                              // 1

  // ── L01-L05: Zorluk ~4-12, renk rotasyonu başlıyor ────────────
  {goals:[{level:3,contains:[2]}]},                                                // L01 — yeşil giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},                         // L02 — yeşil + turuncu
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},                         // L03 — mavi + yeşil (yeni renk erken tanıtım)
  {goals:[{level:3,contains:[2]},{level:2,contains:[1,0]}]},                       // L04 — nefes: yeşil + sarı-pembe
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2,1]}]},                     // L05 — BOSS: yeşil double derin

  // ── L06-L10: Zorluk ~5-14, mavi-yeşil karışımı ──────────────
  {goals:[{level:4,contains:[3]}]},                                                // L06 — mavi giriş
  {goals:[{level:4,contains:[3]},{level:2,contains:[1,0]}]},                       // L07 — mavi + sarı-pembe sürpriz
  {goals:[{level:3,contains:[2,1]},{level:4,contains:[3]}]},                       // L08 — yeşil derin + mavi
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},                         // L09 — nefes: mavi + yeşil tanıdık
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},                     // L10 — BOSS: mavi double derin

  // ── L11-L15: Zorluk ~6-17, mor devreye giriyor ──────────────
  {goals:[{level:5,contains:[4]}]},                                                // L11 — mor giriş
  {goals:[{level:5,contains:[4]},{level:3,contains:[2]}]},                         // L12 — mor + yeşil atlama
  {goals:[{level:4,contains:[3,2]},{level:5,contains:[4]}]},                       // L13 — mavi derin + mor sürpriz
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},                         // L14 — nefes: mor + mavi tanıdık
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},                     // L15 — BOSS: mor double derin

  // ── L16-L20: Zorluk ~7-19, kırmızı + full mix ───────────────
  {goals:[{level:6,contains:[5]}]},                                                // L16 — kırmızı giriş
  {goals:[{level:6,contains:[5]},{level:3,contains:[2,1]}]},                       // L17 — kırmızı + yeşil sürpriz
  {goals:[{level:5,contains:[4,3]},{level:6,contains:[5]}]},                       // L18 — mor derin + kırmızı
  {goals:[{level:6,contains:[5]},{level:4,contains:[3]}]},                         // L19 — nefes: kırmızı + mavi
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},                     // L20 — BOSS: kırmızı double derin

  // ── ENDLESS (L21+) ─────────────────────────────────────────────
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},                     // L21
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5]}]},                     // L22
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]}, // L23
  {goals:[{level:6,contains:[5,4,3]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]}, // L24
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4,3]},{level:6,contains:[5]}]},   // L25
];

export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
