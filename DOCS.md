# Matrushka — Proje Dokümantasyonu

## Genel Bakış

**Matrushka**, canvas tabanlı bir merge/puzzle mobil oyunudur. Oyuncu, top düşürerek aynı seviyedeki topları birleştirir ve daha büyük toplar oluşturur. Her level belirli hedeflerin tamamlanmasını gerektirir. Oyun 50 level + 1 tutorial'dan oluşur ve 5 checkpoint'e bölünmüştür.

---

## Dosya Yapısı

```
matrushka/
├── index.html
└── js/
    ├── state.js          — Merkezi paylaşılan state
    ├── constants.js      — Layout hesaplamaları, level tanımları
    ├── world-config.js   — Checkpoint/dünya konfigürasyonları
    ├── game.js           — Ana döngü, input, level yönetimi
    ├── physics.js        — Çarpışma, absorb, fizik
    ├── renderer.js       — Canvas 2D çizim
    ├── goals.js          — Hedef eşleştirme ve animasyon
    ├── blast.js          — Blast butonu mekanikleri
    ├── hints.js          — Tutorial ipucu çizimi
    ├── tutorial.js       — Tutorial adım yönetimi
    ├── audio.js          — Howler.js ses efektleri
    ├── theme.js          — Renk paleti yönetimi
    └── map.js            — Pixi.js harita ekranı
```

---

## Temel Mekanikler

### Top Düşürme
- Üstte bekleyen `nextBall` tıklanarak `heldBall`'a dönüştürülür
- `heldBall` sürüklenerek bırakılır veya arenayla bir tıklama ile direkt tepeye düşürülür
- `nextBall` pick edildiğinde pick edilenin kalan timer süresi kadar beklendikten sonra yeni `nextBall` üretilir
- `autoDropDeadline` (1 sn) dolduğunda top otomatik düşer — `heldBall` varlığından bağımsız

### Birleşme (Merge)
- Aynı level, `contains` boş iki top çarpıştığında bir üst levele merge olur
- Merge zincirleri combo sayacını artırır

### Absorb (Yutma)
- Büyük top küçüğü yutabilir; küçük top büyüğün `contains` dizisine girer
- Hedef eşleştirmede nested yapı önemlidir: `{ level: 4, contains: [3, 2] }`

### Hedefler (Goals)
- Her level 1–3 hedef slotuna sahiptir
- Hedef: belirli level ve `contains` kombinasyonu
- Eşleşen top hedef slota uçar, tüm slotlar dolunca level tamamlanır

### Blast
- Arenayla aynı seviyedeki topları etkileyen dinamik butonlar
- Sınırlı şarj sayısı (level başına 1–4)
- Ateşleme sırasıyla gerçekleşir (120ms aralık)

### Dünya Döndürme
- Arenaın dış halkasından sürükleyerek dünya döndürülür
- `rotVel` ile ivme kazanır, sürtünmeyle durur

### Game Over
- Yeni top için üstte **anlamlı boş yer** bulunamazsa (penetrasyon > yarıçapın %40'ı) game over
- Top önce görünür (üst üste binen hem top hem altındaki top kırmızı halo alır), 800ms sonra game over tetiklenir

---

## Level & Dünya Yapısı

| Yapı | Değer |
|------|-------|
| Toplam level | 50 + 1 tutorial |
| Checkpoint sayısı | 5 |
| CP başına level | 10 |
| Şekil tipleri | sphere, jellybear, matrushka, duck, fish |

Her CP 5 şablon üzerinden inşa edilir:
- **L1–L2**: 1 slotlu giriş
- **L3–L5**: 2 slotlu ısınma
- **L6–L8**: 3 slotlu baskı
- **L9–L10**: Boss level

---

## State (`state.js`)

Tüm modüller bu merkezi objeyi okur/yazar.

| Değişken | Açıklama |
|----------|----------|
| `circles` | Arenادaki aktif toplar |
| `nextBall` | Üstte bekleyen önizleme topu |
| `heldBall` | Oyuncunun sürüklediği top |
| `draggedCircle` | Arenada elle sürüklenen mevcut top |
| `gameOver` | Oyun bitti durumu |
| `levelSuccess` | Level tamamlandı |
| `goalSlots` | Hedef slot durumları |
| `combo / comboTimer` | Merge streak sayacı |
| `autoDropDeadline` | Otomatik düşme zamanı (ms) |
| `worldRot / rotVel` | Arena rotasyonu |
| `BLAST_BTNS` | Blast buton durumları ve şarjlar |
| `isPaused / isMuted` | Pause ve ses durumu |
| `_nextBallBlocked` | Yeni topun boş yer bulamadığı durum |

---

## Layout & Mobil Adaptasyon (`constants.js`)

### `buildLayout()`
- **`visualViewport` API**: Android Chrome/Samsung'da toolbar hariç gerçek yüksekliği alır
- **DPR**: Maksimum 2'ye sabitlenir (performans)
- **`S = MIN_DIM / 800`**: Tüm UI elemanları bu oranla ölçeklenir
- **`SCORE_AREA`**: `H`'ın %18–24'ü — küçük ekranlarda kompakt kalır
- **Safe area**: `env(safe-area-inset-bottom)` ile Android nav bar / iPhone home indicator hesaplanır

### `index.html`
```css
height: 100vh;
height: 100dvh;              /* Chrome/Android: browser chrome hariç */
min-height: -webkit-fill-available; /* Samsung Internet fallback */
```

### `game.js`
- `window.visualViewport` resize event dinlenir → toolbar gizlenince layout yeniden hesaplanır

---

## Rendering (`renderer.js`)

**Canvas 2D** tabanlı. Pixi.js yalnızca harita ekranında kullanılır.

- **Toplar**: Level'a göre çok parçalı şekil (jellybear = gövde + kafa + kulaklar + kollar + ayaklar)
- **Şekil tanımları**: `SHAPE_DEFS` — her part `ox, oy, r` çarpanlarıyla `c.r`'a göre ölçeklenir
- **Partiküller**: Merge noktasında renk eşleşmeli patlama animasyonu
- **Chain waves**: Merge'den yayılan halka efekti
- **Flying goals**: Hedef slota yay yörüngesiyle uçan top
- **HUD**: Score alanı, hedef gemler, blast butonu, ses/pause butonları
- **Üst sınır**: U ağzında aynı arena rengiyle sabit kesik çizgi
- **Blocked halo**: Boş yer yokken hem `nextBall` hem çakışan top kırmızı pulse halo alır

---

## Harita Ekranı (`map.js`)

**Pixi.js** tabanlı. Canvastan bağımsız `div` içinde çalışır.

- Level node'ları tıklanabilir daireler olarak gösterilir
- Bézier eğrili yol tamamlanan segmentlerde renkli olur
- CP geçişlerinde konfeti yağmuru animasyonu
- İlerleme `localStorage`'da saklanır (`matrushka_progress`)
- Font: `"ui-rounded","Arial Rounded MT Bold",sans-serif` (gameplay ile aynı)
- Bölüm isimleri gösterilmez

---

## Ses (`audio.js`)

Howler.js kullanır. Tab gizlenince otomatik mute, görünür olunca `isMuted` durumuna göre geri açılır.

| Ses | Tetikleyici |
|-----|-------------|
| `spawn` | Top arenaya düştüğünde |
| `pick` | Top pick edildiğinde |
| `merge` | İki top birleştiğinde |
| `absorb` | Top yutulduğunda |
| `blast` | Blast ateşlendiğinde |
| `gameOver` | Game over tetiklendiğinde |
| `levelComplete` | Level tamamlandığında |

---

## Performans Notları

- Parçacık sayısı maksimum 80 ile sınırlandırılmış
- `_sortedCircles` her 3 frame'de bir güncellenir
- Arena rengi (`_cachedArenaColor`) her 3 frame'de bir hesaplanır
- Shape cache: aynı şekil/boyut/renk kombinasyonu `OffscreenCanvas`'ta önbelleğe alınır
- Squish/boing animasyonu aktifken cache devre dışı bırakılır

---

## Kısayollar

| Eylem | Kontrol |
|-------|---------|
| Pause / Resume | `Space` |
| Ses aç/kapat | Ses butonu |
| Top sürükle | Touch/Mouse drag |
| Arena döndür | Dış halkadan sürükle |
| Blast | Blast butonu |
