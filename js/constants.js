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
    { r: Math.round(MAIN_R * (38 / 360)),  color: '#F5FF00', vy: 1.8 }, // 1 sarı
    { r: Math.round(MAIN_R * (51 / 360)),  color: '#FF9500', vy: 2.2 }, // 2 turuncu
    { r: Math.round(MAIN_R * (68 / 360)),  color: '#00C853', vy: 2.7 }, // 3 yeşil
    { r: Math.round(MAIN_R * (90 / 360)),  color: '#00B0FF', vy: 3.2 }, // 4 mavi
    { r: Math.round(MAIN_R * (120 / 360)), color: '#AA00FF', vy: 3.8 }, // 5 mor
    { r: Math.round(MAIN_R * (160 / 360)), color: '#FF1744', vy: 4.5 }, // 6 kırmızı
  ];
}

export const LEVEL_DEFS = [
  {goals:[{level:3,contains:[2,1]}]},
  {goals:[{level:2,contains:[1,0]}]},
  {goals:[{level:3,contains:[2,1]}]},
  {goals:[{level:3,contains:[2]}]},
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]}]},
  {goals:[{level:3,contains:[2,1]},{level:2,contains:[1,0]}]},
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2,1]}]},
  {goals:[{level:4,contains:[3]}]},
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},
  {goals:[{level:4,contains:[3]},{level:3,contains:[2,1]}]},
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]},{level:3,contains:[2]}]},
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},
  {goals:[{level:5,contains:[4]}]},
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},
  {goals:[{level:5,contains:[4]},{level:3,contains:[2,1]}]},
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},
  {goals:[{level:6,contains:[5]}]},
  {goals:[{level:6,contains:[5]},{level:5,contains:[4]}]},
  {goals:[{level:6,contains:[5]},{level:4,contains:[3,2]}]},
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5]}]},
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},
  {goals:[{level:6,contains:[5,4,3]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4,3]},{level:6,contains:[5]}]},
];

export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#F5FF00', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
