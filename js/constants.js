// ── constants.js ──────────────────────────────────────────────────
export const TUTORIAL_LEVELS = 3;

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

export function buildLevels(MAIN_R) {
  // Renk sırası: sıcaktan soğuğa — sarı turuncudan önce gelir
  return [
    { r: Math.round(MAIN_R * (28 / 360)),  color: '#FF5EBC', vy: 1.4 }, // 0 pembe
    { r: Math.round(MAIN_R * (38 / 360)),  color: '#FFD700', vy: 1.8 }, // 1 sarı
    { r: Math.round(MAIN_R * (51 / 360)),  color: '#FF9500', vy: 2.2 }, // 2 turuncu
    { r: Math.round(MAIN_R * (68 / 360)),  color: '#00C853', vy: 2.7 }, // 3 yeşil
    { r: Math.round(MAIN_R * (90 / 360)),  color: '#00B0FF', vy: 3.2 }, // 4 mavi
    { r: Math.round(MAIN_R * (120 / 360)), color: '#AA00FF', vy: 3.8 }, // 5 mor
    { r: Math.round(MAIN_R * (160 / 360)), color: '#FF1744', vy: 4.5 }, // 6 kırmızı
  ];
}

export const LEVEL_DEFS = [
  // ── TUTORIAL (0-2) ──────────────────────────────────────────────
  {goals:[{level:3,contains:[2,1]}]},                                              // 0
  {goals:[{level:2,contains:[1,0]}]},                                              // 1
  {goals:[{level:3,contains:[2,1]}]},                                              // 2

  // ── ARC 1: YEŞİL (L01-L05) ─────────────────────────────────────
  // Giriş → Tırman → Derin → Nefes → BOSS
  {goals:[{level:3,contains:[2]}]},                                                // L01  4.5 — kolay giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},                         // L02  8.0 — 2 slot, sığ
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]}]},                       // L03 10.5 — 2 slot, biri derin
  {goals:[{level:3,contains:[2]},{level:2,contains:[1,0]}]},                       // L04  8.5 — nefes (2 slot, tanıdık)
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2,1]}]},                     // L05 12.0 — BOSS: 2 slot, ikisi derin

  // ── ARC 2: MAVİ (L06-L10) ──────────────────────────────────────
  // Giriş → Tırman → Derin → Nefes → BOSS
  {goals:[{level:4,contains:[3]}]},                                                // L06  5.5 — kolay giriş, yeni renk
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},                         // L07 10.0 — 2 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2,1]}]},                       // L08 11.5 — 2 slot, derin
  {goals:[{level:4,contains:[3]},{level:4,contains:[3]}]},                         // L09  9.0 — nefes (2 slot, tekrar)
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},                     // L10 14.0 — BOSS: 2 slot, ikisi derin

  // ── ARC 3: MOR (L11-L15) ───────────────────────────────────────
  // Giriş → Tırman → Sürpriz → Nefes → BOSS
  {goals:[{level:5,contains:[4]}]},                                                // L11  6.5 — kolay giriş, yeni renk
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},                         // L12 12.0 — 2 slot
  {goals:[{level:5,contains:[4]},{level:3,contains:[2,1]}]},                       // L13 12.5 — sürpriz: mor + yeşil mix
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},                         // L14 12.0 — nefes (tanıdık kombinasyon)
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},                     // L15 17.0 — BOSS: 2 slot, ikisi derin

  // ── ARC 4: KIRMIZI (L16-L20) ───────────────────────────────────
  // Giriş → Tırman → Sürpriz → Nefes → BOSS
  {goals:[{level:6,contains:[5]}]},                                                // L16  7.5 — kolay giriş, yeni renk
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]}]},                         // L17 14.0 — 2 slot
  {goals:[{level:6,contains:[5]},{level:4,contains:[3,2]}]},                       // L18 14.5 — sürpriz: kırmızı + mavi mix
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]}]},                         // L19 14.0 — nefes (tanıdık kombinasyon)
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},                     // L20 19.0 — BOSS: 2 slot, ikisi derin

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
