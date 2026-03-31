// ── world-config.js ───────────────────────────────────────────────
// 4 AKTLI HİKAYE TASARIMI — Jellybean Paleti
//
// Akt 1 (CP 00-04): Sabah — açık pastel bg, candy renkler
// Akt 2 (CP 05-09): Öğle — koyu bg, canlı doygun
// Akt 3 (CP 10-14): Gece — derin koyu bg, parlak renkler
// Akt 4 (CP 15-19): Endgame — siyaha yakın bg, şeker bombası
//
// PALETTE KURALI:
//   Her renk bir öncekinden ~51° hue atlıyor (360°÷7).
//   S=100, L=47-64 → Candy Crush jellybean sweet spot.
//   Hiçbir palette'te komşu iki renk birbirine yakın ton değil.
//
// SHAPE DAĞILIMI:
//   sphere:    0, 3, 6, 9, 11, 14, 16, 19   (8 CP)
//   bear:      1, 4, 7, 10, 13, 15, 18       (7 CP)
//   matrushka: 2, 5, 8, 12, 17               (5 CP — en nadir)

export const LEVELS_PER_CP = 10;
export const TOTAL_CHECKPOINTS = 20;

export const WORLD_CONFIG = [

  // ── AKT 1: SABAH ─────────────────────────────────────────────────

  // CP 00 · sphere · hue başlangıç: 340°
  { id: 0, name: 'Pembe Sabah', subtitle: 'Hoş geldin',
    shape: 'sphere',
    bgColor: '#ffd6e8',
    palette: ['#ff3d9e', '#ff3d47', '#ff9100', '#ffe600', '#14ff76', '#00c3ff', '#9b00ff'] },

  // CP 01 · bear · hue başlangıç: 52°
  { id: 1, name: 'Limon Tarlası', subtitle: 'Tatlı başlangıç',
    shape: 'bear',
    bgColor: '#fff0b3',
    palette: ['#ffdd00', '#88ff00', '#00ff99', '#00ccff', '#0055ff', '#cc00ff', '#ff0088'] },

  // CP 02 · matrushka · hue başlangıç: 158°
  { id: 2, name: 'Nane Bahçesi', subtitle: 'Taze dünya',
    shape: 'matrushka',
    bgColor: '#c8ffe0',
    palette: ['#00f279', '#00ccff', '#0044ff', '#cc00ff', '#ff0077', '#ff6600', '#ffee00'] },

  // CP 03 · sphere · hue başlangıç: 210°
  { id: 3, name: 'Şeker Göğü', subtitle: 'Sonsuz mavi',
    shape: 'duck',
    bgColor: '#c8e4ff',
    palette: ['#0099ff', '#8800ff', '#ff00aa', '#ff6600', '#ffee00', '#44ff00', '#00ffdd'] },

  // CP 04 · bear · hue başlangıç: 272°
  { id: 4, name: 'Lavanta', subtitle: 'Kadife çiçekler',
    shape: 'fish',
    bgColor: '#e4d0ff',
    palette: ['#aa00ff', '#ff0077', '#ff7700', '#ffe500', '#55ff00', '#00ffcc', '#00aaff'] },

  // ── AKT 2: ÖĞLE ──────────────────────────────────────────────────

  // CP 05 · matrushka · hue başlangıç: 18°
  { id: 5, name: 'Mercan Ateşi', subtitle: 'Sıcak sular',
    shape: 'sphere',
    bgColor: '#1a0500',
    palette: ['#ff5200', '#ff0088', '#aa00ff', '#0055ff', '#00ccff', '#00ff88', '#aaff00'] },

  // CP 06 · sphere · hue başlangıç: 168°
  { id: 6, name: 'Tropikal', subtitle: 'Cennet adası',
    shape: 'bear',
    bgColor: '#001510',
    palette: ['#00e87a', '#00b8ff', '#0033ff', '#aa00ff', '#ff0066', '#ff6600', '#ffee00'] },

  // CP 07 · bear · hue başlangıç: 46°
  { id: 7, name: 'Altın Çağ', subtitle: 'Zafer ve ihtişam',
    shape: 'matrushka',
    bgColor: '#140c00',
    palette: ['#ffcc00', '#aaff00', '#00ff99', '#00bbff', '#4400ff', '#cc00ff', '#ff0066'] },

  // CP 08 · matrushka · hue başlangıç: 320°
  { id: 8, name: 'Şafak', subtitle: 'Yeni bir gün',
    shape: 'duck',
    bgColor: '#140008',
    palette: ['#ff00bb', '#dd00ff', '#3300ff', '#0099ff', '#00ffcc', '#88ff00', '#ffaa00'] },

  // CP 09 · sphere · hue başlangıç: 118°
  { id: 9, name: 'Zümrüt Orman', subtitle: 'Derinlerin sırrı',
    shape: 'fish',
    bgColor: '#001505',
    palette: ['#44ff00', '#00ffaa', '#00aaff', '#3300ff', '#cc00ff', '#ff0055', '#ff8800'] },

  // ── AKT 3: GECE ──────────────────────────────────────────────────

  // CP 10 · bear · hue başlangıç: 28°
  { id: 10, name: 'Gün Batımı', subtitle: 'Son ışıklar',
    shape: 'sphere',
    bgColor: '#0f0400',
    palette: ['#ff6600', '#ff0077', '#aa00ff', '#0044ff', '#00bbff', '#00ff88', '#99ff00'] },

  // CP 11 · sphere · hue başlangıç: 198°
  { id: 11, name: 'Okyanus Gecesi', subtitle: 'Derin sular',
    shape: 'bear',
    bgColor: '#000810',
    palette: ['#00aaff', '#0022ff', '#9900ff', '#ff0077', '#ff5500', '#ffdd00', '#66ff00'] },

  // CP 12 · matrushka · hue başlangıç: 122°
  { id: 12, name: 'Neon Orman', subtitle: 'Tehlikeli güzellik',
    shape: 'matrushka',
    bgColor: '#010a01',
    palette: ['#55ff00', '#00ffbb', '#00aaff', '#2200ff', '#cc00ff', '#ff0044', '#ff7700'] },

  // CP 13 · bear · hue başlangıç: 288°
  { id: 13, name: 'Mor Nebula', subtitle: 'Galaksinin kalbinde',
    shape: 'duck',
    bgColor: '#080012',
    palette: ['#cc00ff', '#ff0055', '#ff7700', '#ffee00', '#66ff00', '#00ffcc', '#00aaff'] },

  // CP 14 · sphere · hue başlangıç: 188° · S=85 (hafif daha soft)
  { id: 14, name: 'Buz Sarayı', subtitle: 'Kristal soğuk',
    shape: 'fish',
    bgColor: '#000810',
    palette: ['#00d4f0', '#0044ee', '#7700dd', '#ee0088', '#ee6600', '#dddd00', '#44ee00'] },

  // ── AKT 4: ENDGAME ───────────────────────────────────────────────

  // CP 15 · bear · hue başlangıç: 12°
  { id: 15, name: 'Volkan', subtitle: 'Patlama anı',
    shape: 'sphere',
    bgColor: '#0a0000',
    palette: ['#ff4400', '#ff0088', '#bb00ff', '#3300ff', '#00aaff', '#00ff88', '#aaff00'] },

  // CP 16 · sphere · hue başlangıç: 194°
  { id: 16, name: 'Kripto', subtitle: 'Dijital dünya',
    shape: 'bear',
    bgColor: '#00030e',
    palette: ['#00aaff', '#0011ff', '#9900ff', '#ff0066', '#ff6600', '#ffdd00', '#77ff00'] },

  // CP 17 · matrushka · hue başlangıç: 72°
  { id: 17, name: 'Zehir', subtitle: 'Tehlikeli karışım',
    shape: 'matrushka',
    bgColor: '#040400',
    palette: ['#eeee00', '#88ff00', '#00ffaa', '#00aaff', '#2200ff', '#cc00ff', '#ff0066'] },

  // CP 18 · bear · hue başlangıç: 304°
  { id: 18, name: 'Karanlık Ejder', subtitle: 'Son sınav',
    shape: 'duck',
    bgColor: '#04000c',
    palette: ['#ee00cc', '#aa00ff', '#1100ff', '#0099ff', '#00ffee', '#99ff00', '#ffbb00'] },

  // CP 19 · sphere · hue başlangıç: 0°
  { id: 19, name: 'Kaos', subtitle: 'Her şeyin sonu',
    shape: 'fish',
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
