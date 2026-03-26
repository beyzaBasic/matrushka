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

  // ── CP 0: Klasik (Tutorial + L1-10) ─────────────────────────────
  // Orijinal oyun renkleri
  {
    id: 0,
    name: 'Klasik',
    subtitle: 'Hoş geldin',
    bgColor: '#0d0a1a',
    palette: [
      '#FF5EBC',  // 0 — pembe
      '#FFD700',  // 1 — sarı
      '#FF9500',  // 2 — turuncu
      '#00C853',  // 3 — yeşil
      '#00B0FF',  // 4 — mavi
      '#AA00FF',  // 5 — mor
      '#FF1744',  // 6 — kırmızı
    ],
  },

  // ── CP 1: Lav (L11-20) ───────────────────────────────────────────
  // Sıcak, yanıcı, enerjik
  {
    id: 1,
    name: 'Lav',
    subtitle: 'Isı yükseliyor',
    bgColor: '#1a0500',
    palette: [
      '#FFF176',  // 0 — soluk sarı
      '#FFD600',  // 1 — altın
      '#FF9100',  // 2 — yanık turuncu
      '#FF3D00',  // 3 — lav kırmızısı
      '#DD2C00',  // 4 — koyu lav
      '#BF360C',  // 5 — demir kırmızı
      '#4E342E',  // 6 — volkanik kahve
    ],
  },

  // ── CP 2: Bataklık (L21-30) ──────────────────────────────────────
  // Asit, toksik, gizemli yeşil
  {
    id: 2,
    name: 'Bataklık',
    subtitle: 'Derinlere dalıyoruz',
    bgColor: '#010d00',
    palette: [
      '#CCFF90',  // 0 — asit yeşil açık
      '#B2FF59',  // 1 — neon lime
      '#76FF03',  // 2 — elektrik yeşil
      '#00E676',  // 3 — parlak yeşil
      '#00BFA5',  // 4 — zümrüt
      '#1B5E20',  // 5 — orman koyu
      '#33691E',  // 6 — yosun
    ],
  },

  // ── CP 3: Okyanus (L31-40) ───────────────────────────────────────
  // Derin mavi, soğuk, serin
  {
    id: 3,
    name: 'Okyanus',
    subtitle: 'Sonsuz derinlik',
    bgColor: '#00051a',
    palette: [
      '#E0F7FA',  // 0 — buz mavisi
      '#80DEEA',  // 1 — turkuaz açık
      '#26C6DA',  // 2 — aqua
      '#0288D1',  // 3 — okyanus mavisi
      '#01579B',  // 4 — derin deniz
      '#1A237E',  // 5 — lacivert
      '#0D1B4B',  // 6 — abissal karanlık
    ],
  },

  // ── CP 4: Fırtına (L41-50) ───────────────────────────────────────
  // Mor, gri, elektrik — dramatik
  {
    id: 4,
    name: 'Fırtına',
    subtitle: 'Şimşekler çakıyor',
    bgColor: '#06001a',
    palette: [
      '#E8EAF6',  // 0 — soluk leylak
      '#B39DDB',  // 1 — soft mor
      '#7E57C2',  // 2 — iris
      '#5E35B1',  // 3 — elektrik mor
      '#4527A0',  // 4 — fırtına moru
      '#E040FB',  // 5 — şimşek pembesi
      '#1A0533',  // 6 — gece yarısı
    ],
  },

  // ── CP 5: Kum (L51-60) ───────────────────────────────────────────
  // Sıcak toprak tonları, çöl atmosferi
  {
    id: 5,
    name: 'Çöl',
    subtitle: 'Sonsuz kum',
    bgColor: '#1a1000',
    palette: [
      '#FFF9C4',  // 0 — soluk krem
      '#FFE082',  // 1 — kum sarısı
      '#FFB300',  // 2 — amber
      '#FF8F00',  // 3 — karamel
      '#E65100',  // 4 — terracotta
      '#BF360C',  // 5 — kızıl toprak
      '#3E2723',  // 6 — çöl gecesi
    ],
  },

  // ── CP 6: Buz (L61-70) ───────────────────────────────────────────
  // Soğuk beyaz, kristal, parlak
  {
    id: 6,
    name: 'Buz',
    subtitle: 'Kristal soğuk',
    bgColor: '#001830',
    palette: [
      '#FFFFFF',  // 0 — beyaz
      '#E3F2FD',  // 1 — çok açık mavi
      '#90CAF9',  // 2 — buz mavisi
      '#42A5F5',  // 3 — açık mavi
      '#1565C0',  // 4 — derin mavi
      '#0D47A1',  // 5 — buz altı
      '#01003D',  // 6 — donmuş gece
    ],
  },

  // ── CP 7: Neon (L71-80) ──────────────────────────────────────────
  // Siber, parlak, retro-fütüristik
  {
    id: 7,
    name: 'Neon',
    subtitle: 'Siber dünya',
    bgColor: '#000514',
    palette: [
      '#F8FF00',  // 0 — neon sarı
      '#00FFF0',  // 1 — cyan
      '#00FF41',  // 2 — matrix yeşil
      '#FF00FF',  // 3 — magenta
      '#FF4500',  // 4 — neon turuncu
      '#7B00FF',  // 5 — elektrik mor
      '#FF0055',  // 6 — neon pembe
    ],
  },

  // ── CP 8: Mercan (L81-90) ────────────────────────────────────────
  // Pembe, turuncu, sıcak deniz
  {
    id: 8,
    name: 'Mercan',
    subtitle: 'Sıcak sular',
    bgColor: '#1a0008',
    palette: [
      '#FCE4EC',  // 0 — çok açık pembe
      '#F48FB1',  // 1 — mercan pembesi
      '#F06292',  // 2 — somon
      '#E91E63',  // 3 — koyu pembe
      '#FF7043',  // 4 — mercan turuncu
      '#FF5722',  // 5 — kor turuncu
      '#BF360C',  // 6 — koyu mercan
    ],
  },

  // ── CP 9: Altın (L91-100) ────────────────────────────────────────
  // Zengin, parlak, prestijli
  {
    id: 9,
    name: 'Altın',
    subtitle: 'Saf zafer',
    bgColor: '#130e00',
    palette: [
      '#FFFDE7',  // 0 — krem
      '#FFF59D',  // 1 — soluk altın
      '#FFEE58',  // 2 — altın sarısı
      '#FDD835',  // 3 — parlak altın
      '#F9A825',  // 4 — amber altın
      '#E65100',  // 5 — bronz
      '#3E2723',  // 6 — koyu bronz
    ],
  },

  // ── CP 10: Zehir (L101-110) ──────────────────────────────────────
  // Toksik, tehlikeli, karanlık yeşil-mor
  {
    id: 10,
    name: 'Zehir',
    subtitle: 'Tehlikeli karışım',
    bgColor: '#070010',
    palette: [
      '#F3E5F5',  // 0 — soluk leylak
      '#CE93D8',  // 1 — açık mor
      '#AB47BC',  // 2 — zehir moru
      '#7B1FA2',  // 3 — koyu mor
      '#69F0AE',  // 4 — zehir yeşili
      '#00C853',  // 5 — asit yeşil
      '#1B5E20',  // 6 — koyu zehir
    ],
  },

  // ── CP 11: Güneş Batımı (L111-120) ───────────────────────────────
  // Turuncu, pembe, mor — romantik gökyüzü
  {
    id: 11,
    name: 'Güneş Batımı',
    subtitle: 'Son ışık',
    bgColor: '#1a0510',
    palette: [
      '#FFF3E0',  // 0 — şafak beyazı
      '#FFCC80',  // 1 — açık turuncu
      '#FFA726',  // 2 — turuncu
      '#FF7043',  // 3 — ateş
      '#E91E63',  // 4 — gün batımı pembesi
      '#9C27B0',  // 5 — alacakaranlık moru
      '#1A0020',  // 6 — gece
    ],
  },

  // ── CP 12: Opal (L121-130) ───────────────────────────────────────
  // İnci, gökkuşağı, sedefli
  {
    id: 12,
    name: 'Opal',
    subtitle: 'Sedef parlaklık',
    bgColor: '#050510',
    palette: [
      '#E0F2F1',  // 0 — sedef beyaz
      '#80CBC4',  // 1 — aquamarin
      '#26A69A',  // 2 — jade
      '#7E57C2',  // 3 — ametist
      '#EC407A',  // 4 — pembe opal
      '#29B6F6',  // 5 — gökyüzü
      '#0D3349',  // 6 — koyu opal
    ],
  },

  // ── CP 13: Kan (L131-140) ────────────────────────────────────────
  // Kırmızı, bordo, dramatik
  {
    id: 13,
    name: 'Kan',
    subtitle: 'Son sınır',
    bgColor: '#0f0000',
    palette: [
      '#FFCDD2',  // 0 — açık pembe kırmızı
      '#EF9A9A',  // 1 — soluk kan
      '#E53935',  // 2 — kan kırmızısı
      '#C62828',  // 3 — koyu kan
      '#B71C1C',  // 4 — bordo
      '#7F0000',  // 5 — koyu bordo
      '#1C0000',  // 6 — siyah kan
    ],
  },

  // ── CP 14: Uzay (L141-150) ───────────────────────────────────────
  // Kozmik, derin, yıldızlı
  {
    id: 14,
    name: 'Uzay',
    subtitle: 'Galaksinin ötesi',
    bgColor: '#000008',
    palette: [
      '#E8EAF6',  // 0 — yıldız beyazı
      '#7986CB',  // 1 — nebula mavisi
      '#3949AB',  // 2 — kozmik mavi
      '#8E24AA',  // 3 — galaksi moru
      '#00ACC1',  // 4 — kuasar
      '#F4511E',  // 5 — kırmızı dev yıldız
      '#01000D',  // 6 — derin uzay
    ],
  },

  // ── CP 15: Jöle (L151-160) ───────────────────────────────────────
  // Translucent, canlı, tatlı
  {
    id: 15,
    name: 'Jöle',
    subtitle: 'Tatlı kaos',
    bgColor: '#0a001a',
    palette: [
      '#FFEB3B',  // 0 — sarı jöle
      '#FF9800',  // 1 — turuncu jöle
      '#E91E63',  // 2 — pembe jöle
      '#9C27B0',  // 3 — mor jöle
      '#3F51B5',  // 4 — mavi jöle
      '#009688',  // 5 — yeşil jöle
      '#F44336',  // 6 — kırmızı jöle
    ],
  },

  // ── CP 16: Granit (L161-170) ─────────────────────────────────────
  // Metalik, soğuk, endüstriyel
  {
    id: 16,
    name: 'Granit',
    subtitle: 'Demir ve çelik',
    bgColor: '#080808',
    palette: [
      '#ECEFF1',  // 0 — beyaz gri
      '#B0BEC5',  // 1 — gümüş
      '#78909C',  // 2 — çelik
      '#546E7A',  // 3 — demir
      '#37474F',  // 4 — antrasit
      '#CFD8DC',  // 5 — krom (kontrast)
      '#102027',  // 6 — siyah çelik
    ],
  },

  // ── CP 17: Volkan (L171-180) ─────────────────────────────────────
  // Turuncu, sarı, siyah — volkanik
  {
    id: 17,
    name: 'Volkan',
    subtitle: 'Patlama anı',
    bgColor: '#0f0500',
    palette: [
      '#FFFF8D',  // 0 — parlak sarı
      '#FFD740',  // 1 — altın sarısı
      '#FFAB40',  // 2 — kor turuncu
      '#FF6D00',  // 3 — lav
      '#DD2C00',  // 4 — volkan kırmızısı
      '#FF4081',  // 5 — pembe kor (kontrast)
      '#1A0A00',  // 6 — kül siyahı
    ],
  },

  // ── CP 18: Aura (L181-190) ───────────────────────────────────────
  // Gökkuşağı, tüm renkler, final öncesi
  {
    id: 18,
    name: 'Aura',
    subtitle: 'Tüm renkler bir arada',
    bgColor: '#050005',
    palette: [
      '#FF4081',  // 0 — pembe
      '#FF6D00',  // 1 — turuncu
      '#FFD600',  // 2 — sarı
      '#00E676',  // 3 — yeşil
      '#00B0FF',  // 4 — mavi
      '#D500F9',  // 5 — mor
      '#FF1744',  // 6 — kırmızı
    ],
  },

  // ── CP 19: Kaos (L191-200) ───────────────────────────────────────
  // Karanlık, karşıt, final — maksimum zorluk
  {
    id: 19,
    name: 'Kaos',
    subtitle: 'Son sınav',
    bgColor: '#000000',
    palette: [
      '#EEFF41',  // 0 — asit sarı
      '#FF1744',  // 1 — kırmızı
      '#00E5FF',  // 2 — cyan
      '#FF9100',  // 3 — turuncu
      '#D500F9',  // 4 — neon mor
      '#00E676',  // 5 — neon yeşil
      '#FFFFFF',  // 6 — beyaz (en büyük, dramatik)
    ],
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
