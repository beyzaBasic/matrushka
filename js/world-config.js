// ── world-config.js ───────────────────────────────────────────────
// 4 AKTLI HİKAYE TASARIMI — Jellybean Paleti
//
// Akt 1 (CP 00-04): Sabah — açık pastel bg, candy renkler
// Akt 2 (CP 05-09): Öğle — koyu bg, canlı doygun
// Akt 3 (CP 10-14): Gece — derin koyu bg, parlak renkler
// Akt 4 (CP 15-19): Endgame — siyaha yakın bg, şeker bombası
//
// SHAPE DAĞILIMI (5 shape, her akt farklı rotasyon):
//   sphere:    0, 6, 12, 18        (4 CP)
//   jellybear: 1, 9, 13, 15        (4 CP)
//   matrushka: 2, 5, 11, 19        (4 CP)
//   duck:      3, 7, 14, 16        (4 CP)
//   fish:      4, 8, 10, 17        (4 CP)

export const LEVELS_PER_CP = 10;
export const TOTAL_CHECKPOINTS = 20;

export const WORLD_CONFIG = [

  // ── AKT 1: SABAH ─────────────────────────────────────────────────

  // CP 00 · sphere
  { id: 0, name: 'Pembe Sabah', subtitle: 'Hoş geldin',
    shape: 'sphere',
    bgColor: '#ffd6e8',
    palette: ['#ff3d9e', '#ff3d47', '#ff9100', '#ffe600', '#14ff76', '#00c3ff', '#9b00ff'] },

  // CP 01 · jellybear
  { id: 1, name: 'Limon Tarlası', subtitle: 'Tatlı başlangıç',
    shape: 'jellybear',
    bgColor: '#fff0b3',
    palette: ['#ffdd00', '#88ff00', '#00ff99', '#00ccff', '#0055ff', '#cc00ff', '#ff0088'] },

  // CP 02 · matrushka
  { id: 2, name: 'Nane Bahçesi', subtitle: 'Taze dünya',
    shape: 'matrushka',
    bgColor: '#c8ffe0',
    palette: ['#00f279', '#00ccff', '#0044ff', '#cc00ff', '#ff0077', '#ff6600', '#ffee00'] },

  // CP 03 · duck
  { id: 3, name: 'Şeker Göğü', subtitle: 'Sonsuz mavi',
    shape: 'duck',
    bgColor: '#c8e4ff',
    palette: ['#0099ff', '#8800ff', '#ff00aa', '#ff6600', '#ffee00', '#44ff00', '#00ffdd'] },

  // CP 04 · fish
  { id: 4, name: 'Lavanta', subtitle: 'Kadife çiçekler',
    shape: 'fish',
    bgColor: '#e4d0ff',
    palette: ['#aa00ff', '#ff0077', '#ff7700', '#ffe500', '#55ff00', '#00ffcc', '#00aaff'] },

  // ── AKT 2: ÖĞLE ──────────────────────────────────────────────────

  // CP 05 · matrushka
  { id: 5, name: 'Mercan Ateşi', subtitle: 'Sıcak sular',
    shape: 'matrushka',
    bgColor: '#1a0500',
    palette: ['#ff5200', '#ff0088', '#aa00ff', '#0055ff', '#00ccff', '#00ff88', '#aaff00'] },

  // CP 06 · sphere
  { id: 6, name: 'Tropikal', subtitle: 'Cennet adası',
    shape: 'sphere',
    bgColor: '#001510',
    palette: ['#00e87a', '#00b8ff', '#0033ff', '#aa00ff', '#ff0066', '#ff6600', '#ffee00'] },

  // CP 07 · duck
  { id: 7, name: 'Altın Çağ', subtitle: 'Zafer ve ihtişam',
    shape: 'duck',
    bgColor: '#140c00',
    palette: ['#ffcc00', '#aaff00', '#00ff99', '#00bbff', '#4400ff', '#cc00ff', '#ff0066'] },

  // CP 08 · fish
  { id: 8, name: 'Şafak', subtitle: 'Yeni bir gün',
    shape: 'fish',
    bgColor: '#140008',
    palette: ['#ff00bb', '#dd00ff', '#3300ff', '#0099ff', '#00ffcc', '#88ff00', '#ffaa00'] },

  // CP 09 · jellybear
  { id: 9, name: 'Zümrüt Orman', subtitle: 'Derinlerin sırrı',
    shape: 'jellybear',
    bgColor: '#001505',
    palette: ['#44ff00', '#00ffaa', '#00aaff', '#3300ff', '#cc00ff', '#ff0055', '#ff8800'] },

  // ── AKT 3: GECE ──────────────────────────────────────────────────

  // CP 10 · fish
  { id: 10, name: 'Gün Batımı', subtitle: 'Son ışıklar',
    shape: 'fish',
    bgColor: '#0f0400',
    palette: ['#ff6600', '#ff0077', '#aa00ff', '#0044ff', '#00bbff', '#00ff88', '#99ff00'] },

  // CP 11 · matrushka
  { id: 11, name: 'Okyanus Gecesi', subtitle: 'Derin sular',
    shape: 'matrushka',
    bgColor: '#000810',
    palette: ['#00aaff', '#0022ff', '#9900ff', '#ff0077', '#ff5500', '#ffdd00', '#66ff00'] },

  // CP 12 · sphere
  { id: 12, name: 'Neon Orman', subtitle: 'Tehlikeli güzellik',
    shape: 'sphere',
    bgColor: '#010a01',
    palette: ['#55ff00', '#00ffbb', '#00aaff', '#2200ff', '#cc00ff', '#ff0044', '#ff7700'] },

  // CP 13 · jellybear
  { id: 13, name: 'Mor Nebula', subtitle: 'Galaksinin kalbinde',
    shape: 'jellybear',
    bgColor: '#080012',
    palette: ['#cc00ff', '#ff0055', '#ff7700', '#ffee00', '#66ff00', '#00ffcc', '#00aaff'] },

  // CP 14 · duck
  { id: 14, name: 'Buz Sarayı', subtitle: 'Kristal soğuk',
    shape: 'duck',
    bgColor: '#000810',
    palette: ['#00d4f0', '#0044ee', '#7700dd', '#ee0088', '#ee6600', '#dddd00', '#44ee00'] },

  // ── AKT 4: ENDGAME ───────────────────────────────────────────────

  // CP 15 · jellybear
  { id: 15, name: 'Volkan', subtitle: 'Patlama anı',
    shape: 'jellybear',
    bgColor: '#0a0000',
    palette: ['#ff4400', '#ff0088', '#bb00ff', '#3300ff', '#00aaff', '#00ff88', '#aaff00'] },

  // CP 16 · duck
  { id: 16, name: 'Kripto', subtitle: 'Dijital dünya',
    shape: 'duck',
    bgColor: '#00030e',
    palette: ['#00aaff', '#0011ff', '#9900ff', '#ff0066', '#ff6600', '#ffdd00', '#77ff00'] },

  // CP 17 · fish
  { id: 17, name: 'Zehir', subtitle: 'Tehlikeli karışım',
    shape: 'fish',
    bgColor: '#040400',
    palette: ['#eeee00', '#88ff00', '#00ffaa', '#00aaff', '#2200ff', '#cc00ff', '#ff0066'] },

  // CP 18 · sphere
  { id: 18, name: 'Karanlık Ejder', subtitle: 'Son sınav',
    shape: 'sphere',
    bgColor: '#04000c',
    palette: ['#ee00cc', '#aa00ff', '#1100ff', '#0099ff', '#00ffee', '#99ff00', '#ffbb00'] },

  // CP 19 · matrushka
  { id: 19, name: 'Kaos', subtitle: 'Her şeyin sonu',
    shape: 'matrushka',
    bgColor: '#000000',
    palette: ['#ff2200', '#ff00cc', '#9900ff', '#0055ff', '#00ddff', '#00ff66', '#ddff00'] },

];

export function getWorldConfig(cpIdx) {
  const idx = Math.max(0, Math.min(cpIdx, WORLD_CONFIG.length - 1));
  return WORLD_CONFIG[idx];
}

export function cpIdxFromLevel(internalLevel, tutorialLevels = 2) {
  const gameLevel = internalLevel - tutorialLevels;
  if (gameLevel < 0) return 0;
  return Math.floor(gameLevel / LEVELS_PER_CP);
}

export function levelFromCpIdx(cpIdx, tutorialLevels = 2) {
  return cpIdx * LEVELS_PER_CP + tutorialLevels;
}

export function cpLevelRange(cpIdx) {
  const lo = cpIdx * LEVELS_PER_CP + 1;
  const hi = (cpIdx + 1) * LEVELS_PER_CP;
  return { lo, hi };
}
