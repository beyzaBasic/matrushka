// ── world-config.js ───────────────────────────────────────────────
// 4 AKTLI HİKAYE TASARIMI — Jellybean Paleti
//
// Akt 1 (CP 00-04): Sabah — Ferah arka planlar, candy (şeker) evrim serileri.
// Akt 2 (CP 05-09): Öğle — Egzotik, doygun ve sıcak temalar.
// Akt 3 (CP 10-14): Gece — Koyu arka planda parlayan neon renkler.
// Akt 4 (CP 15-19): Endgame — Yüksek kontrast, siberpunk ve kaos temaları.
//
// SHAPE DAĞILIMI (5 shape, her akt farklı rotasyon):
//   sphere:    0, 6, 12, 18        (4 CP)
//   jellybear: 1, 9, 13, 15        (4 CP)
//   matrushka: 2, 5, 11, 19        (4 CP)
//   duck:      3, 7, 14, 16        (4 CP)
//   fish:      4, 8, 10, 17        (4 CP)

export const LEVELS_PER_CP = 10;
export const TOTAL_CHECKPOINTS = 5;

// ── Kap form tanımları (physics + renderer paylaşır) ─────────────
// openFrac: alt yay açısı katsayısı (0..1 * PI). Küçük → geniş yuvarlak dip, büyük → dar uzun.
// topWidthFactor: üst açıklık / junction genişliği oranı.
//   1.0 = dik duvar, >1 = dışa açılan (kadeh), <1 = içe kapanan (vazo)
export const CONTAINER_FORMS = {
  classicU:  { openFrac: 0.50, topWidthFactor: 1.00 }, // CP0 – standart U
  roundBowl: { openFrac: 0.32, topWidthFactor: 1.00 }, // CP1 – geniş yuvarlak kase
  tallNarrow:{ openFrac: 0.68, topWidthFactor: 1.00 }, // CP2 – dar uzun tüp
  goblet:    { openFrac: 0.50, topWidthFactor: 1.20 }, // CP3 – kadeh (dışa açılır)
  vase:      { openFrac: 0.50, topWidthFactor: 0.65 }, // CP4 – vazo (içe kapanır)
};

export const WORLD_CONFIG = [

  // ── AKT 1: SABAH ─────────────────────────────────────────────────

  // CP 00 · sphere (Tatlı Uyanış) — Klasik U, hafif yerçekimi
  { id: 0, name: 'Tatlı Uyanış', subtitle: 'İlk Dokunuş',
    shape: 'sphere', bgColor: '#0D1B4B',
    lightBg: ['#F0E8D8', '#E8DCCA', '#DDD0B8', '#D9CAAB'], // Warm Sand
    palette: ['#FFE135', '#FF6D00', '#E91E8C', '#2979FF', '#1DE9B6', '#CE93D8', '#FFD600'],
    containerForm: CONTAINER_FORMS.classicU,
    gravity: 0.28 },

  // CP 01 · jellybear (Limon Tarlası) — Yuvarlak kase, normal yerçekimi
  { id: 1, name: 'Limon Tarlası', subtitle: 'Ekşiden Tatlıya',
    shape: 'jellybear', bgColor: '#F5FFFA',
    lightBg: ['#EEE8F5', '#E4DBF0', '#D4C8E8', '#C4B8DA'], // Dusty Lavender
    palette: ['#ADFF2F', '#FFD700', '#FFA500', '#FF7F50', '#FF1493', '#8A2BE2', '#0000CD'],
    containerForm: CONTAINER_FORMS.roundBowl,
    gravity: 0.35 },

  // ── AKT 2: ÖĞLE ──────────────────────────────────────────────────

  // CP 02 · matrushka (Nane Bahçesi) — Dar uzun tüp, orta yerçekimi
  { id: 2, name: 'Nane Bahçesi', subtitle: 'Taze dünya',
    shape: 'matrushka', bgColor: '#c8ffe0',
    lightBg: ['#EFF5EC', '#E2EDD9', '#CCDFC4', '#BCCFAF'], // Soft Sage
    palette: ['#00f279', '#00ccff', '#0044ff', '#cc00ff', '#ff0077', '#ff6600', '#ffee00'],
    containerForm: CONTAINER_FORMS.tallNarrow,
    gravity: 0.44 },

  // CP 03 · duck (Mavi Şeker) — Kadeh (dışa açılır), ağır yerçekimi
  { id: 3, name: 'Mavi Şeker', subtitle: 'Bulutların Üstünde',
    shape: 'duck', bgColor: '#D1E9FF',
    lightBg: ['#F0E8D8', '#E8DCCA', '#DDD0B8', '#D9CAAB'], // Warm Sand
    palette: ['#FF1493', '#9B00FF', '#0088FF', '#00CCFF', '#00DD00', '#FFD700', '#FF6600'],
    containerForm: CONTAINER_FORMS.goblet,
    gravity: 0.53 },

  // ── AKT 4: ENDGAME ───────────────────────────────────────────────

  // CP 04 · fish (Lavanta Rüyası) — Vazo (içe kapanır), çok ağır yerçekimi
  { id: 4, name: 'Lavanta Rüyası', subtitle: 'Sakin Sular',
    shape: 'fish', bgColor: '#EBDDFF',
    lightBg: ['#EFF5EC', '#E2EDD9', '#CCDFC4', '#BCCFAF'], // Soft Sage
    palette:['#9B00FF', '#FF1493', '#FF6600', '#FFD700', '#00CC00', '#00E5FF', '#0088FF'],
    containerForm: CONTAINER_FORMS.vase,
    gravity: 0.64 },

];

export function getWorldConfig(cpIdx) {
  const idx = Math.max(0, Math.min(cpIdx, WORLD_CONFIG.length - 1));
  return WORLD_CONFIG[idx];
}

export function cpIdxFromLevel(internalLevel, tutorialLevels = 1) {
  const gameLevel = internalLevel - tutorialLevels;
  if (gameLevel < 0) return 0;
  return Math.floor(gameLevel / LEVELS_PER_CP);
}

export function levelFromCpIdx(cpIdx, tutorialLevels = 1) {
  return cpIdx * LEVELS_PER_CP + tutorialLevels;
}

export function cpLevelRange(cpIdx) {
  const lo = cpIdx * LEVELS_PER_CP + 1;
  const hi = (cpIdx + 1) * LEVELS_PER_CP;
  return { lo, hi };
}