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

// Boyut oranları — renkten bağımsız
const LEVEL_RATIOS = [
  { ratio: 28/360, vy: 1.4 }, // 0 — en küçük
  { ratio: 38/360, vy: 1.8 }, // 1
  { ratio: 51/360, vy: 2.2 }, // 2
  { ratio: 68/360, vy: 2.7 }, // 3
  { ratio: 90/360, vy: 3.2 }, // 4
  { ratio:120/360, vy: 3.8 }, // 5
  { ratio:160/360, vy: 4.5 }, // 6 — en büyük
];

const FALLBACK_PALETTE = ['#FF5EBC','#FFD700','#FF9500','#00C853','#00B0FF','#AA00FF','#FF1744'];

/**
 * palette: world-config'den gelen 7 renk (küçükten büyüğe)
 * palette[0] = level 0 (en küçük), palette[6] = level 6 (en büyük)
 */
export function buildLevels(MAIN_R, palette) {
  const colors = (palette && palette.length >= 7) ? palette : FALLBACK_PALETTE;
  return LEVEL_RATIOS.map((lv, i) => ({
    r: Math.round(MAIN_R * lv.ratio),
    color: colors[i],
    vy: lv.vy,
  }));
}

export const LEVEL_DEFS = [

  // ── TUTORIAL (0-1) ─────────────────────────────────────────────
  {goals:[{level:2,contains:[1]}]},  // TUT0 — küçük zincir
  {goals:[{level:3,contains:[2,1]}]},  // TUT1 — 3 katmanlı zincir

  // ── CP 01: Klasik (L1-10) ────────────────────────────────────────
  {goals:[{level:1,contains:[0]}]},  // L01 giriş — sarı∋pembe
  {goals:[{level:2,contains:[1]}]},  // L02 — turuncu∋sarı
  {goals:[{level:2,contains:[1]},{level:1,contains:[0]}]},  // L03 — 2 slot kolay
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L04 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L05 — derin zincir
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L06 — mavi∋yeşil
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L07 — çift derin
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3,2]}]},  // L08 boss — çift mavi
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L09 boss — mor giriyor
  {goals:[{level:2,contains:[1]}]},  // L10 nefes — geri dön

  // ── CP 02: Gökkuşağı (L11-20) ──────────────────────────────────
  {goals:[{level:2,contains:[1]}]},  // L11 giriş — sarı∋turuncu
  {goals:[{level:3,contains:[2]}]},  // L12 — yeşil∋sarı
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L13 — 2 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L14 yükseliş — mavi∋yeşil
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L15 — derin mavi
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]}]},  // L16 — mor∋mavi
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L17 — çift derin
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]}]},  // L18 boss — çift mor
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L19 boss — pembe(6) giriyor
  {goals:[{level:3,contains:[2]}]},  // L20 nefes

  // ── CP 03: Şeker Dükkanı (L21-30) ────────────────────────────────
  {goals:[{level:2,contains:[1]}]},  // L21 giriş
  {goals:[{level:3,contains:[2]}]},  // L22
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L23 — 2 slot
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]}]},  // L24 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L25 — derin
  {goals:[{level:5,contains:[4]},{level:4,contains:[3]}]},  // L26 — turuncu(5) giriyor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L27 — çift derin
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L28 boss — mint(6)
  {goals:[{level:6,contains:[5,4,3]},{level:5,contains:[4,3]}]},  // L29 boss — 4 derin
  {goals:[{level:3,contains:[2]}]},  // L30 nefes

  // ── CP 04: Okyanus (L31-40) ─────────────────────────────────────
  {goals:[{level:2,contains:[1]}]},  // L31 giriş
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L32
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]}]},  // L33 — çift aynı
  {goals:[{level:4,contains:[3]},{level:3,contains:[2,1]}]},  // L34 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:4,contains:[3]}]},  // L35
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]}]},  // L36 — lacivert(5)
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L37 — çift derin
  {goals:[{level:6,contains:[5,4]},{level:6,contains:[5,4]}]},  // L38 boss — gece(6)
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L39 boss
  {goals:[{level:3,contains:[2]}]},  // L40 nefes

  // ── CP 05: Neon (L41-50) ───────────────────────────────────────
  {goals:[{level:2,contains:[1]},{level:2,contains:[1]}]},  // L41 giriş — 2 slot
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L42
  {goals:[{level:3,contains:[2]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L43 — 3 slot giriş
  {goals:[{level:4,contains:[3]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L44 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L45
  {goals:[{level:5,contains:[4]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L46
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2]}]},  // L47 — 3 derin
  {goals:[{level:5,contains:[4,3]},{level:5,contains:[4,3]},{level:4,contains:[3]}]},  // L48 boss
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L49 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L50 nefes

  // ── CP 06-20: Endgame (L51-200) ──────────────────────────────────
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L51 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L52 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L53 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L54 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L55 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L56 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L57 zor
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L58 boss
  {goals:[{level:6,contains:[5,4]},{level:5,contains:[4,3]},{level:4,contains:[3,2]}]},  // L59 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L60 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L61 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L62 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L63 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L64 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L65 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L66 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L67 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L68 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4]},{level:5,contains:[4,3]}]},  // L69 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L70 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L71 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L72 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L73 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L74 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L75 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L76 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L77 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L78 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L79 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L80 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L81 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L82 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L83 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L84 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L85 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L86 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L87 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L88 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L89 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L90 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L91 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L92 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L93 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L94 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L95 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L96 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L97 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L98 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L99 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L100 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L101 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L102 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L103 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L104 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L105 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L106 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L107 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L108 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L109 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L110 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L111 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L112 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L113 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L114 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L115 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L116 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L117 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L118 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L119 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L120 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L121 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L122 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L123 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L124 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L125 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L126 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L127 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L128 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L129 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L130 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L131 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L132 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L133 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L134 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L135 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L136 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L137 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L138 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L139 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L140 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L141 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L142 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L143 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L144 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L145 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L146 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L147 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L148 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L149 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L150 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L151 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L152 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L153 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L154 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L155 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L156 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L157 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L158 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L159 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L160 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L161 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L162 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L163 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L164 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L165 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L166 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L167 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L168 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L169 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L170 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L171 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L172 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L173 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L174 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L175 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L176 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L177 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L178 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L179 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L180 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L181 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L182 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L183 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L184 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L185 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L186 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L187 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L188 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L189 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L190 nefes
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L191 giriş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L192 yükseliş
  {goals:[{level:3,contains:[2,1]},{level:3,contains:[2]},{level:2,contains:[1]}]},  // L193 yükseliş
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L194 orta
  {goals:[{level:4,contains:[3,2]},{level:3,contains:[2,1]},{level:2,contains:[1]}]},  // L195 orta
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L196 zor
  {goals:[{level:5,contains:[4,3]},{level:4,contains:[3,2]},{level:3,contains:[2,1]}]},  // L197 zor
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L198 boss
  {goals:[{level:6,contains:[5,4,3]},{level:6,contains:[5,4,3]},{level:6,contains:[5,4]}]},  // L199 boss
  {goals:[{level:3,contains:[2]},{level:2,contains:[1]}]},  // L200 nefes
];


export const BLAST_BTNS_TEMPLATE = [
  { id: 'yellow', levels: [1], color: '#FFD700', maxCharges: 4 },
  { id: 'orange', levels: [2], color: '#FF9500', maxCharges: 3 },
  { id: 'green',  levels: [3], color: '#00C853', maxCharges: 2 },
  { id: 'blue',   levels: [4], color: '#00B0FF', maxCharges: 2 },
  { id: 'purple', levels: [5], color: '#AA00FF', maxCharges: 1 },
  { id: 'red',    levels: [6], color: '#FF1744', maxCharges: 1 },
];
