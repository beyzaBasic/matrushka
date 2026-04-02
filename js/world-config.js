// ── world-config.js ───────────────────────────────────────────────
// 4 AKTLI HİKAYE TASARIMI — Jellybean Paleti
//
// Akt 1 (CP 00-04): Sabah — Ultra temiz, nötr pastel bg, iştah açıcı şeker renkleri
// Akt 2 (CP 05-09): Öğle — Dramatik geçiş, sıcak ve doygun tonlar
// Akt 3 (CP 10-14): Gece — Derin uzay/okyanus, neon vurgular
// Akt 4 (CP 15-19): Endgame — Yüksek kontrast, agresif renkler, kaos
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

  // ── AKT 1: SABAH (Sakinlik, Neşe, İlk Kanca) ───────────────────────

  // CP 00 · sphere -> "HOOK" BÖLÜMÜ (Milyonluk İlk İzlenim)
  // Arka plan neredeyse beyaz, çok hafif ferah bir buz mavisi tınısı var. 
  // Bu sayede ekrana düşen renkli toplar %100 patlayacak ve 3D hissi artacak.
  { id: 0, name: 'Tatlı Uyanış', subtitle: 'İlk Dokunuş',
    shape: 'sphere',
    bgColor: '#F4F8FA', 
    // Palet: Renk çemberinde neşe duygusunu veren sıcacık şeker tonları.
    // Sarı -> Turuncu -> Kırmızı/Pembe -> Mor -> Mavi (Kusursuz birleşme sırası)
    palette: ['#FFDE00', '#FF7B00', '#FF0055', '#D400FF', '#00D0FF', '#00FF55', '#FF00AA'] },

// CP 01 · jellybear -> LİMON TARLASI (Revize)
  // Arka planı sarıdan, çok uçuk, ferah bir "nane/limonata beyazı"na çektik. 
  // Böylece sarı ve yeşil neon objeler ekranda %100 belirgin (pop-out) olacak.
  { id: 1, name: 'Limon Tarlası', subtitle: 'Ekşiden Tatlıya',
    shape: 'jellybear',
    bgColor: '#F5FFFA', // Arka plan: Neredeyse beyaz, çok hafif ferah bir nane alt tonu
    // Palet: Ekşi renklerden (Yeşil/Sarı) -> Tatlı ve Doygun renklere (Pembe/Mor/Mavi)
    // Sıralama: Misket Limonu -> Limon -> Portakal -> Çilek -> Böğürtlen -> Buz Mavisi -> Su Yeşili
    palette: ['#A6FF00', '#FFEA00', '#FF8800', '#FF0066', '#AA00FF', '#00CCFF', '#00FF99'] },
  
    // CP 02 · matrushka
  { id: 2, name: 'Nane Şekeri', subtitle: 'Ferah dünya',
    shape: 'matrushka',
    bgColor: '#E6FFF2', // Tertemiz, göz yormayan bir nane beyazı
    palette: ['#0055FF', '#00CCFF', '#00FF66', '#FFEE00', '#FF5500', '#FF0077', '#CC00FF'] },

  // CP 03 · duck (2. Ekran Görüntüsü - Bebek Mavisi ve Ördekler)
  { id: 3, name: 'Mavi Şeker', subtitle: 'Bulutların Üstünde',
    shape: 'duck',
    bgColor: '#d1e9ff', // Ekran görüntüsündeki yumuşak bebek mavisi
    // Sol menüdeki evrim sırası (Küçükten büyüğe): 
    // Mor -> Mavi -> Camgöbeği -> Yeşil -> Sarı -> Turuncu -> Pembe
    palette: ['#8800ff', '#0066ff', '#00e5ff', '#44ff00', '#ffdd00', '#ff6600', '#ff0055'] },

  // CP 04 · fish (1. Ekran Görüntüsü - Lila ve Balıklar)
  { id: 4, name: 'Lavanta Rüyası', subtitle: 'Sakin Sular',
    shape: 'fish',
    bgColor: '#ebddff', // Ekran görüntüsündeki çok uçuk lila/pembe arka plan
    // Sol menüdeki evrim sırası (Küçükten büyüğe): 
    // Mavi -> Camgöbeği -> Yeşil -> Sarı -> Turuncu -> Pembe -> Mor
    palette: ['#0080ff', '#00e5ff', '#55ff00', '#ffcc00', '#ff7700', '#ff0088', '#a300ff'] },
  // ── AKT 2: ÖĞLE (Aksiyon, Tutku, Hızlanma) ───────────────────────

  // CP 05 · matrushka
  { id: 5, name: 'Mercan Ateşi', subtitle: 'Sıcak sular',
    shape: 'matrushka',
    bgColor: '#2A0A00',
    palette: ['#0055FF', '#00CCFF', '#00FF88', '#AAFF00', '#FFCC00', '#FF5200', '#FF0088'] },

  // CP 06 · sphere
  { id: 6, name: 'Tropikal', subtitle: 'Cennet adası',
    shape: 'sphere',
    bgColor: '#001A14',
    palette: ['#0033FF', '#00B8FF', '#00E87A', '#FFEE00', '#FF6600', '#FF0066', '#AA00FF'] },

  // CP 07 · duck
  { id: 7, name: 'Altın Çağ', subtitle: 'Zafer ve ihtişam',
    shape: 'duck',
    bgColor: '#1A1200',
    palette: ['#4400FF', '#00BBFF', '#00FF99', '#AAFF00', '#FFCC00', '#FF0066', '#CC00FF'] },

  // CP 08 · fish
  { id: 8, name: 'Şafak', subtitle: 'Yeni bir gün',
    shape: 'fish',
    bgColor: '#1F000D',
    palette: ['#3300FF', '#0099FF', '#00FFCC', '#88FF00', '#FFAA00', '#FF00BB', '#DD00FF'] },

  // CP 09 · jellybear
  { id: 9, name: 'Zümrüt Orman', subtitle: 'Derinlerin sırrı',
    shape: 'jellybear',
    bgColor: '#002008',
    palette: ['#3300FF', '#00AAFF', '#00FFAA', '#44FF00', '#FF8800', '#FF0055', '#CC00FF'] },

  // ── AKT 3: GECE (Gizem, Odaklanma, Neon Etkisi) ──────────────────

  // CP 10 · fish
  { id: 10, name: 'Gün Batımı', subtitle: 'Son ışıklar',
    shape: 'fish',
    bgColor: '#1A0700',
    palette: ['#0044FF', '#00BBFF', '#00FF88', '#99FF00', '#FFDD00', '#FF6600', '#FF0077'] },

  // CP 11 · matrushka
  { id: 11, name: 'Okyanus Gecesi', subtitle: 'Derin sular',
    shape: 'matrushka',
    bgColor: '#001122',
    palette: ['#0022FF', '#00AAFF', '#00FFAA', '#66FF00', '#FFDD00', '#FF5500', '#FF0077'] },

  // CP 12 · sphere
  { id: 12, name: 'Neon Orman', subtitle: 'Tehlikeli güzellik',
    shape: 'sphere',
    bgColor: '#021402',
    palette: ['#2200FF', '#00AAFF', '#00FFBB', '#55FF00', '#FFEE00', '#FF7700', '#FF0044'] },

  // CP 13 · jellybear
  { id: 13, name: 'Mor Nebula', subtitle: 'Galaksinin kalbinde',
    shape: 'jellybear',
    bgColor: '#110026',
    palette: ['#00AAFF', '#00FFCC', '#66FF00', '#FFEE00', '#FF7700', '#FF0055', '#CC00FF'] },

  // CP 14 · duck
  { id: 14, name: 'Buz Sarayı', subtitle: 'Kristal soğuk',
    shape: 'duck',
    bgColor: '#001122',
    palette: ['#0044EE', '#00D4F0', '#00FFAA', '#44EE00', '#DDDD00', '#EE6600', '#EE0088'] },

  // ── AKT 4: ENDGAME (Stres, Kaos, Patlama) ────────────────────────

  // CP 15 · jellybear
  { id: 15, name: 'Volkan', subtitle: 'Patlama anı',
    shape: 'jellybear',
    bgColor: '#140000',
    palette: ['#3300FF', '#00AAFF', '#00FF88', '#AAFF00', '#FFCC00', '#FF4400', '#FF0088'] },

  // CP 16 · duck
  { id: 16, name: 'Kripto', subtitle: 'Dijital dünya',
    shape: 'duck',
    bgColor: '#00061C',
    palette: ['#0011FF', '#00AAFF', '#00FFAA', '#77FF00', '#FFDD00', '#FF6600', '#FF0066'] },

  // CP 17 · fish
  { id: 17, name: 'Zehir', subtitle: 'Tehlikeli karışım',
    shape: 'fish',
    bgColor: '#0A0A00',
    palette: ['#2200FF', '#00AAFF', '#00FFAA', '#88FF00', '#EEEE00', '#FF6600', '#CC00FF'] },

  // CP 18 · sphere
  { id: 18, name: 'Karanlık Ejder', subtitle: 'Son sınav',
    shape: 'sphere',
    bgColor: '#080018',
    palette: ['#1100FF', '#0099FF', '#00FFEE', '#99FF00', '#FFBB00', '#FF0066', '#AA00FF'] },

  // CP 19 · matrushka
  { id: 19, name: 'Kaos', subtitle: 'Her şeyin sonu',
    shape: 'matrushka',
    bgColor: '#000000',
    palette: ['#00FF66', '#FF2200', '#00DDFF', '#FF00CC', '#DDFF00', '#9900FF', '#0055FF'] },

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