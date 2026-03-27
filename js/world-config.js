// ── world-config.js ───────────────────────────────────────────────
// Tüm checkpoint'lerin özelliklerini tek yerden yönetir.
// map.js, game.js ve ileride eklenecek her sistem buradan okur.
//
// Her checkpoint 10 level kapsar (LEVELS_PER_CP = 10).
// 20 checkpoint = 200 level toplam.
//
// Checkpoint index → internal level:
//   internalLevel = cpIdx * 10 + TUTORIAL_LEVELS (2)
//
// Yeni özellik eklemek için sadece bu dosyaya alan ekle,
// sisteme bağlamak için ilgili manager'a bir satır eklemek yeter.

export const LEVELS_PER_CP = 10;
export const TOTAL_CHECKPOINTS = 20;

// ── Checkpoint tanımları ──────────────────────────────────────────
// Her obje bir "dünya" = 1 checkpoint = 10 level
// ── Renk seti tasarım ilkesi ─────────────────────────────────────
// Her checkpoint 7 top rengi içerir (level 0→6, küçükten büyüğe).
// Renkler birbirinden belirgin şekilde ayrışır (gökkuşağı mantığı)
// ama aynı set içinde atmosferik uyum taşır.
// palette[0] = en küçük top (level 0), palette[6] = en büyük top (level 6)
// (8. eleman harita küresinin dış halkası için — oyun toplarına uygulanmaz)

export const WORLD_CONFIG = [

  // ── CP 00: Klasik (Tutorial + L1-10) ─────────────────────────
  {
    id: 0, name: 'Klasik', subtitle: 'Hoş geldin',
    bgColor: '#0d0a1a',
    palette: ['#FF5EBC','#FFD700','#FF9500','#00C853','#00B0FF','#AA00FF','#FF1744'],
  },

  // ── CP 01: Gökkuşağı (L11-20) ────────────────────────────────
  {
    id: 1, name: 'Gökkuşağı', subtitle: 'Tüm renkler',
    bgColor: '#0a0a0a',
    palette: ['#FF0000','#FF7700','#FFE000','#00CC00','#0055FF','#8800FF','#FF00CC'],
  },

  // ── CP 02: Şeker Dükkanı (L21-30) ────────────────────────────
  {
    id: 2, name: 'Şeker Dükkanı', subtitle: 'Tatlı dünya',
    bgColor: '#120818',
    palette: ['#FF66AA','#FFD700','#00DD66','#00AAFF','#BB44FF','#FF8800','#00FFCC'],
  },

  // ── CP 03: Okyanus (L31-40) ───────────────────────────────────
  {
    id: 3, name: 'Okyanus', subtitle: 'Sonsuz derinlik',
    bgColor: '#00051a',
    palette: ['#00FFFF','#00AAFF','#0055FF','#00FF99','#FF00FF','#0000CC','#003366'],
  },

  // ── CP 04: Neon (L41-50) ─────────────────────────────────────
  {
    id: 4, name: 'Neon', subtitle: 'Siber dünya',
    bgColor: '#000514',
    palette: ['#FF00FF','#00FFFF','#FF0066','#00FF00','#FFFF00','#FF6600','#6600FF'],
  },

  // ── CP 05: Buz (L51-60) ──────────────────────────────────────
  {
    id: 5, name: 'Buz', subtitle: 'Kristal soğuk',
    bgColor: '#001830',
    palette: ['#FFFFFF','#AADDFF','#55AAFF','#0077FF','#00CCFF','#0033CC','#001166'],
  },

  // ── CP 06: Zehir (L61-70) ────────────────────────────────────
  {
    id: 6, name: 'Zehir', subtitle: 'Tehlikeli karışım',
    bgColor: '#070010',
    palette: ['#CCFF00','#00FF66','#FF00AA','#AA00FF','#FF6600','#009900','#660099'],
  },

  // ── CP 07: Güneş (L71-80) ────────────────────────────────────
  {
    id: 7, name: 'Güneş', subtitle: 'Sıcak ve parlak',
    bgColor: '#1a1000',
    palette: ['#FFE000','#FFAA00','#FF6600','#FF3300','#FF0066','#FFFF66','#CC3300'],
  },

  // ── CP 08: Mercan (L81-90) ───────────────────────────────────
  {
    id: 8, name: 'Mercan', subtitle: 'Sıcak sular',
    bgColor: '#1a0008',
    palette: ['#FF4466','#FF7744','#FFAA22','#FF2288','#CC0044','#FF99AA','#880022'],
  },

  // ── CP 09: Hazine (L91-100) ──────────────────────────────────
  {
    id: 9, name: 'Hazine', subtitle: 'Altın ve zafer',
    bgColor: '#130e00',
    palette: ['#FFD700','#FF2200','#0066FF','#00CC44','#FF6600','#CC00FF','#00DDFF'],
  },

  // ── CP 10: Gece (L101-110) ───────────────────────────────────
  {
    id: 10, name: 'Gece', subtitle: 'Büyülü karanlık',
    bgColor: '#000814',
    palette: ['#AA00FF','#0000FF','#FF0055','#00FFCC','#FF6600','#4400CC','#001133'],
  },

  // ── CP 11: Güneş Batımı (L111-120) ───────────────────────────
  {
    id: 11, name: 'Güneş Batımı', subtitle: 'Son ışık',
    bgColor: '#1a0510',
    palette: ['#FF0066','#FF9900','#FFEE00','#00FF88','#0088FF','#8800FF','#FF0099'],
  },

  // ── CP 12: Uzay (L121-130) ───────────────────────────────────
  {
    id: 12, name: 'Uzay', subtitle: 'Galaksinin ötesi',
    bgColor: '#000008',
    palette: ['#FFFFFF','#AAAAFF','#FF4444','#4444FF','#FFAA00','#00FFAA','#220044'],
  },

  // ── CP 13: Opal (L131-140) ───────────────────────────────────
  {
    id: 13, name: 'Opal', subtitle: 'Sedef parlaklık',
    bgColor: '#050510',
    palette: ['#FF66FF','#66FFFF','#66FF66','#FFFF66','#FF6666','#6666FF','#FF66AA'],
  },

  // ── CP 14: Gece Yarısı (L141-150) ────────────────────────────
  {
    id: 14, name: 'Gece Yarısı', subtitle: 'Neon ve karanlık',
    bgColor: '#000000',
    palette: ['#FF0033','#FF7700','#FFEE00','#00FF55','#0044FF','#9900FF','#FF00BB'],
  },

  // ── CP 15: Volkan (L151-160) ─────────────────────────────────
  {
    id: 15, name: 'Volkan', subtitle: 'Patlama anı',
    bgColor: '#0f0500',
    palette: ['#FFFF8D','#FFD740','#FFAB40','#FF6D00','#DD2C00','#FF4081','#1A0A00'],
  },

  // ── CP 16: Retro (L161-170) ──────────────────────────────────
  {
    id: 16, name: 'Retro', subtitle: 'Pixel çağı',
    bgColor: '#0a0010',
    palette: ['#FF2244','#FF8800','#FFDD00','#00AAFF','#AA00FF','#00CC88','#FF0088'],
  },

  // ── CP 17: Fırtına (L171-180) ────────────────────────────────
  {
    id: 17, name: 'Fırtına', subtitle: 'Şimşekler çakıyor',
    bgColor: '#06001a',
    palette: ['#CCCCFF','#8888FF','#4444FF','#FF44FF','#00FFFF','#FF4444','#220066'],
  },

  // ── CP 18: Aura (L181-190) ───────────────────────────────────
  {
    id: 18, name: 'Aura', subtitle: 'Tüm renkler bir arada',
    bgColor: '#050005',
    palette: ['#FF0066','#FF9900','#FFCC00','#00FF88','#0088FF','#8800FF','#FF0099'],
  },

  // ── CP 19: Kaos (L191-200) ───────────────────────────────────
  {
    id: 19, name: 'Kaos', subtitle: 'Son sınav',
    bgColor: '#000000',
    palette: ['#FF0000','#FF8800','#FFFF00','#00FF00','#0000FF','#8800FF','#FFFFFF'],
  },
];

// ── Yardımcı fonksiyonlar ─────────────────────────────────────────

/**
 * Checkpoint index'ine göre dünya config'i döndürür.
 * 7 tema döngüsel tekrar eder (CP 7 → Tema 0, CP 8 → Tema 1, vs.)
 */
export function getWorldConfig(cpIdx) {
  // 20 benzersiz checkpoint var, sınırı aş olursa son tekrar eder
  const idx = Math.max(0, Math.min(cpIdx, WORLD_CONFIG.length - 1));
  return WORLD_CONFIG[idx];
}

/**
 * Internal level'dan checkpoint index'i hesapla.
 * (TUTORIAL_LEVELS = 2 varsayılır)
 */
export function cpIdxFromLevel(internalLevel, tutorialLevels = 2) {
  const gameLevel = internalLevel - tutorialLevels;
  if (gameLevel < 0) return 0;
  return Math.floor(gameLevel / LEVELS_PER_CP);
}

/**
 * Checkpoint index'inden internal level hesapla.
 */
export function levelFromCpIdx(cpIdx, tutorialLevels = 2) {
  return cpIdx * LEVELS_PER_CP + tutorialLevels;
}

/**
 * O checkpoint'in level aralığını döndürür (display için).
 * Örn: cp 0 → { lo: 1, hi: 10 }
 */
export function cpLevelRange(cpIdx) {
  const lo = cpIdx * LEVELS_PER_CP + 1;
  const hi = (cpIdx + 1) * LEVELS_PER_CP;
  return { lo, hi };
}
