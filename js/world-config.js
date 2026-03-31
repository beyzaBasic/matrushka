// ── world-config.js ───────────────────────────────────────────────
// Her CP: 7 renk, aynı CP içinde görsel mesafe > 0.15 (belirgin farklılık).
// Küçükten büyüğe: palette[0] = level 0, palette[6] = level 6.

export const LEVELS_PER_CP = 10;
export const TOTAL_CHECKPOINTS = 20;

export const WORLD_CONFIG = [

  // CP 00: Klasik
  { id: 0, name: 'Klasik', subtitle: 'Hoş geldin',
    bgColor: '#0d1a2e',
    palette: ['#fe4c4c', '#ffad32', '#d4ff28', '#0aff33', '#28b7ff', '#7732ff', '#ff3dde'] },

  // CP 01: Gökkuşağı
  { id: 1, name: 'Gökkuşağı', subtitle: 'Tüm renkler',
    bgColor: '#1a0d2e',
    palette: ['#ff6532', '#ffed28', '#5bff0a', '#0affc1', '#2870ff', '#b219ff', '#ff3276'] },

  // CP 02: Şeker Dükkanı
  { id: 2, name: 'Şeker Dükkanı', subtitle: 'Tatlı dünya',
    bgColor: '#2e0d1a',
    palette: ['#fb73b7', '#ad63f6', '#38d9f9', '#24f369', '#ccfa42', '#fac250', '#fa6042'] },

  // CP 03: Okyanus
  { id: 3, name: 'Okyanus', subtitle: 'Sonsuz derinlik',
    bgColor: '#001a2e',
    palette: ['#5bf1ff', '#1884f0', '#0527d0', '#0e947e', '#f91f43', '#f59e46', '#a335f2'] },

  // CP 04: Neon
  { id: 4, name: 'Neon', subtitle: 'Siber dünya',
    bgColor: '#001a1a',
    palette: ['#ff19fe', '#fff428', '#0affea', '#0a0aff', '#06ee06', '#ff5e19', '#ff0054'] },

  // CP 05: Buz
  { id: 5, name: 'Buz', subtitle: 'Kristal soğuk',
    bgColor: '#0a1628',
    palette: ['#e4ecf0', '#a5c6e8', '#5e99ed', '#165ff2', '#0525c6', '#00008e', '#48b9de'] },

  // CP 06: Zehir
  { id: 6, name: 'Zehir', subtitle: 'Tehlikeli karışım',
    bgColor: '#0d1a00',
    palette: ['#c1ff0a', '#ff19d8', '#840aff', '#0ce88c', '#ffb728', '#00e5e5', '#1f43f9'] },

  // CP 07: Güneş
  { id: 7, name: 'Güneş', subtitle: 'Sıcak ve parlak',
    bgColor: '#2e1400',
    palette: ['#ffeb70', '#ff9f19', '#ff630a', '#f42800', '#d00505', '#215890', '#0fbc2c'] },

  // CP 08: Mercan
  { id: 8, name: 'Mercan', subtitle: 'Sıcak sular',
    bgColor: '#2e0a0a',
    palette: ['#f78277', '#ff3d5d', '#f9551f', '#185290', '#fac250', '#a335f2', '#2ec840'] },

  // CP 09: Hazine
  { id: 9, name: 'Hazine', subtitle: 'Altın ve zafer',
    bgColor: '#1a1400',
    palette: ['#ffd83d', '#ff1e0a', '#006aff', '#11d483', '#c519ff', '#20d8e8', '#f39e48'] },

  // CP 10: Gece
  { id: 10, name: 'Gece', subtitle: 'Büyülü karanlık',
    bgColor: '#0a002e',
    palette: ['#6632ff', '#0051f4', '#d819ff', '#0bdac8', '#f20c33', '#f9af2e', '#0fbc2c'] },

  // CP 11: Güneş Batımı
  { id: 11, name: 'Güneş Batımı', subtitle: 'Son ışık',
    bgColor: '#2e0a00',
    palette: ['#ff6d3d', '#ff3287', '#fedb4c', '#b433f4', '#e51300', '#b714b7', '#38bdf8'] },

  // CP 12: Uzay
  { id: 12, name: 'Uzay', subtitle: 'Galaksinin ötesi',
    bgColor: '#00000f',
    palette: ['#f2f2f2', '#f159d8', '#4298ef', '#33f4c4', '#8c30e8', '#fadb42', '#0022cc'] },

  // CP 13: Opal
  { id: 13, name: 'Opal', subtitle: 'Sedef parlaklık',
    bgColor: '#1a1a2e',
    palette: ['#ed829c', '#74a3e6', '#6bdfb9', '#eed46c', '#a56bdf', '#5bc1d6', '#e88f62'] },

  // CP 14: Gece Yarısı
  { id: 14, name: 'Gece Yarısı', subtitle: 'Neon ve karanlık',
    bgColor: '#000000',
    palette: ['#ff0a0a', '#ffb028', '#fff832', '#00f451', '#0aadff', '#6619ff', '#e5e5e5'] },

  // CP 15: Volkan
  { id: 15, name: 'Volkan', subtitle: 'Patlama anı',
    bgColor: '#2e0800',
    palette: ['#fffb8e', '#ff9328', '#ff3b0a', '#d00505', '#1684f2', '#4ac8d6', '#74e622'] },

  // CP 16: Retro
  { id: 16, name: 'Retro', subtitle: 'Pixel çağı',
    bgColor: '#1a002e',
    palette: ['#ff3299', '#19ebff', '#fff83d', '#8c19ff', '#4af810', '#ff8228', '#0a5bff'] },

  // CP 17: Fırtına
  { id: 17, name: 'Fırtına', subtitle: 'Şimşekler çakıyor',
    bgColor: '#000a2e',
    palette: ['#dadde6', '#283aff', '#980aff', '#60b5d1', '#1684f2', '#4505c6', '#f48333'] },

  // CP 18: Aura
  { id: 18, name: 'Aura', subtitle: 'Tüm renkler bir arada',
    bgColor: '#002e1a',
    palette: ['#18f096', '#b01ff9', '#f7449e', '#ffde3d', '#f22816', '#3574f2', '#74e622'] },

  // CP 19: Kaos
  { id: 19, name: 'Kaos', subtitle: 'Son sınav',
    bgColor: '#000000',
    palette: ['#ff193f', '#ff8228', '#fff832', '#00ff55', '#1979ff', '#b219ff', '#ffffff'] },

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
