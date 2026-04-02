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

export const WORLD_CONFIG = [

  // ── AKT 1: SABAH ─────────────────────────────────────────────────

  // CP 00 · sphere (Tatlı Uyanış)
  { id: 0, name: 'Tatlı Uyanış', subtitle: 'İlk Dokunuş',
    shape: 'sphere', bgColor: '#0D1B4B',
    palette: ['#FFE135', '#FF6D00', '#E91E8C', '#2979FF', '#1DE9B6', '#CE93D8', '#FFD600'] },

  // CP 01 · jellybear (Limon Tarlası)
  { id: 1, name: 'Limon Tarlası', subtitle: 'Ekşiden Tatlıya',
    shape: 'jellybear', bgColor: '#F5FFFA',
    palette: ['#ADFF2F', '#FFD700', '#FFA500', '#FF7F50', '#FF1493', '#8A2BE2', '#0000CD'] },

  // ── AKT 2: ÖĞLE ──────────────────────────────────────────────────

  // CP 02 · matrushka (Nane Bahçesi)
  { id: 2, name: 'Nane Bahçesi', subtitle: 'Taze dünya',
    shape: 'matrushka', bgColor: '#c8ffe0',
    palette: ['#00f279', '#00ccff', '#0044ff', '#cc00ff', '#ff0077', '#ff6600', '#ffee00'] },

  // CP 03 · duck (Mavi Şeker)
  { id: 3, name: 'Mavi Şeker', subtitle: 'Bulutların Üstünde',
    shape: 'duck', bgColor: '#D1E9FF',
    palette: ['#8800FF', '#0066FF', '#00E5FF', '#44FF00', '#FFDD00', '#FF6600', '#FF0055'] },

  // ── AKT 4: ENDGAME ───────────────────────────────────────────────

  // CP 04 · fish (Lavanta Rüyası)
  { id: 4, name: 'Lavanta Rüyası', subtitle: 'Sakin Sular',
    shape: 'fish', bgColor: '#EBDDFF',
    palette: ['#0080FF', '#00E5FF', '#55FF00', '#FFCC00', '#FF7700', '#FF0088', '#A300FF'] },

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