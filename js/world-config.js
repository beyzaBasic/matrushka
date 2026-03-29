// ── world-config.js ───────────────────────────────────────────────
// Her CP: 7 renk, aynı CP içinde görsel mesafe > 0.15 (belirgin farklılık).
// Küçükten büyüğe: palette[0] = level 0, palette[6] = level 6.

export const LEVELS_PER_CP = 10;
export const TOTAL_CHECKPOINTS = 20;

export const WORLD_CONFIG = [

  // CP 00: Klasik
  { id: 0, name: 'Klasik', subtitle: 'Hoş geldin',
    bgColor: '#0d0a1a',
    palette: ['#ff3d3d', '#ffad32', '#d4ff28', '#0aff33', '#28b7ff', '#7732ff', '#ff3dde'] },

  // CP 01: Gökkuşağı
  { id: 1, name: 'Gökkuşağı', subtitle: 'Tüm renkler',
    bgColor: '#0a0a0a',
    palette: ['#ff6532', '#ffed28', '#5bff0a', '#0affc1', '#2870ff', '#b219ff', '#ff3276'] },

  // CP 02: Şeker Dükkanı
  { id: 2, name: 'Şeker Dükkanı', subtitle: 'Tatlı dünya',
    bgColor: '#120818',
    palette: ['#f777b7', '#ad63f6', '#38d9f9', '#24f347', '#eafa42', '#fa8950', '#f81037'] },

  // CP 03: Okyanus
  { id: 3, name: 'Okyanus', subtitle: 'Sonsuz derinlik',
    bgColor: '#00051a',
    palette: ['#5bf1ff', '#1884f0', '#0527d0', '#0e947e', '#f91f43', '#f59e46', '#a335f2'] },

  // CP 04: Neon
  { id: 4, name: 'Neon', subtitle: 'Siber dünya',
    bgColor: '#000514',
    palette: ['#ff19fe', '#fff428', '#0affea', '#0a0aff', '#06ee06', '#ff6619', '#ff003f'] },

  // CP 05: Buz
  { id: 5, name: 'Buz', subtitle: 'Kristal soğuk',
    bgColor: '#001830',
    palette: ['#e6ecef', '#a8c6e5', '#5091eb', '#0b50da', '#011c6f', '#f58f46', '#39de7e'] },

  // CP 06: Zehir
  { id: 6, name: 'Zehir', subtitle: 'Tehlikeli karışım',
    bgColor: '#070010',
    palette: ['#c1ff0a', '#ff19d8', '#7f00ff', '#0ee68c', '#ffb728', '#00d2e5', '#f80606'] },

  // CP 07: Güneş
  { id: 7, name: 'Güneş', subtitle: 'Sıcak ve parlak',
    bgColor: '#1a1000',
    palette: ['#ffe770', '#ff470a', '#ba0707', '#690e06', '#3383f4', '#13eb49', '#7b3ff2'] },

  // CP 08: Mercan
  { id: 8, name: 'Mercan', subtitle: 'Sıcak sular',
    bgColor: '#1a0008',
    palette: ['#f5856f', '#ff1965', '#bc1404', '#16e0f2', '#ffe53d', '#a338ee', '#18dc59'] },

  // CP 09: Hazine
  { id: 9, name: 'Hazine', subtitle: 'Altın ve zafer',
    bgColor: '#130e00',
    palette: ['#ffd83d', '#ff1e0a', '#006aff', '#11d483', '#c519ff', '#20d8e8', '#f39e48'] },

  // CP 10: Gece
  { id: 10, name: 'Gece', subtitle: 'Büyülü karanlık',
    bgColor: '#000814',
    palette: ['#6632ff', '#0065f4', '#d819ff', '#11d4c4', '#f20c33', '#f9a42e', '#10c62e'] },

  // CP 11: Güneş Batımı
  { id: 11, name: 'Güneş Batımı', subtitle: 'Son ışık',
    bgColor: '#1a0510',
    palette: ['#ff6d3d', '#ff3287', '#b335f2', '#d61100', '#fedb4c', '#4393e4', '#16e87f'] },

  // CP 12: Uzay
  { id: 12, name: 'Uzay', subtitle: 'Galaksinin ötesi',
    bgColor: '#000008',
    palette: ['#f2f2f2', '#f159d8', '#4598ec', '#35f2c3', '#8c30e8', '#fadb42', '#0022cc'] },

  // CP 13: Opal
  { id: 13, name: 'Opal', subtitle: 'Sedef parlaklık',
    bgColor: '#050510',
    palette: ['#e9859e', '#78a4e2', '#70dbb7', '#edd36d', '#ae6edd', '#5dc0d4', '#e69065'] },

  // CP 14: Gece Yarısı
  { id: 14, name: 'Gece Yarısı', subtitle: 'Neon ve karanlık',
    bgColor: '#000000',
    palette: ['#ff0a0a', '#ff9328', '#eeff32', '#00f466', '#0a84ff', '#8c19ff', '#e5e5e5'] },

  // CP 15: Volkan
  { id: 15, name: 'Volkan', subtitle: 'Patlama anı',
    bgColor: '#0f0500',
    palette: ['#fff58e', '#ff7028', '#cd0808', '#771107', '#5583c3', '#7ad7df', '#67dc2c'] },

  // CP 16: Retro
  { id: 16, name: 'Retro', subtitle: 'Pixel çağı',
    bgColor: '#0a0010',
    palette: ['#ff3299', '#19ebff', '#fff83d', '#8c19ff', '#4cf513', '#ff8228', '#0a5bff'] },

  // CP 17: Fırtına
  { id: 17, name: 'Fırtına', subtitle: 'Şimşekler çakıyor',
    bgColor: '#06001a',
    palette: ['#dadde5', '#283aff', '#980aff', '#7f6fcc', '#0d61d7', '#3c04ae', '#f28435'] },

  // CP 18: Aura
  { id: 18, name: 'Aura', subtitle: 'Tüm renkler bir arada',
    bgColor: '#050005',
    palette: ['#18f096', '#b01ff9', '#f7449e', '#ffde3d', '#f22816', '#3574f2', '#74e622'] },

  // CP 19: Kaos
  { id: 19, name: 'Kaos', subtitle: 'Son sınav',
    bgColor: '#000000',
    palette: ['#ff193f', '#ff8228', '#eeff32', '#00ff55', '#0a84ff', '#9f19ff', '#ffffff'] },

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
