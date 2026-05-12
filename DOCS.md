# Matrushka — Proje Dokümantasyonu

## Genel Bakış

**Matrushka**, Canvas 2D tabanlı mobil hypercasual merge/puzzle oyunudur. Oyuncu top düşürerek aynı seviyedeki topları birleştirir, büyükleri küçükleri yutar. **Tutorial + 5 checkpoint × 10 level = 51 level** içerir. Tutorial `TutorialManager` ile yönetilir; ana oyun döngüsünden ayrı çalışır.

---

## Dosya Yapısı

```
matrushka/
├── index.html            — oyun girişi, Game + MapScreen başlatır
└── js/
    ├── state.js          — merkezi paylaşılan singleton state
    ├── constants.js      — buildLayout, LEVEL_RATIOS, SHAPE_DEFS, buildLevels, LEVEL_DEFS üretimi
    ├── world-config.js   — TEK KAYNAK: CP konfigürasyonu (palette, shape, bg, form, gravity)
    ├── game.js           — ana döngü, input, spawn, merge/absorb, dark mode, level geçişi
    ├── physics.js        — çarpışma, _clampToU, container form'a göre duvar sınırları
    ├── renderer.js       — tüm Canvas 2D çizim işlemleri
    ├── goals.js          — hedef slot sistemi, flying goal animasyonu
    ├── blast.js          — blast butonu mekanikleri
    ├── hints.js          — hint chain çizimi (sadece tutorial'da)
    ├── tutorial.js       — TutorialManager: adım yönetimi, popup, isTutorial/tutDone flagleri
    ├── audio.js          — Howler.js ses efektleri
    ├── theme.js          — ThemeManager: CP geçişinde state.theme dağıtır
    └── map.js            — Pixi.js harita ekranı (MapScreen class)
sounds/
    spawn.mp3, merge.mp3, absorb.mp3, combo.wav
    goalDone.mp3, levelComplete.mp3, gameOver.mp3, pick.mp3, blast.mp3
```

### Satır sayıları (referans)

| Dosya | Satır |
|-------|-------|
| renderer.js | 1636 |
| game.js | 1223 |
| tutorial.js | 832 |
| map.js | 505 |
| physics.js | 329 |
| constants.js | 257 |
| hints.js | 143 |
| goals.js | 122 |
| theme.js | 101 |
| world-config.js | 99 |
| blast.js | 80 |
| audio.js | 52 |
| state.js | 46 |

---

## Veri Akışı

```
world-config.js  (palette[7], lightBg[4], shape, containerForm, gravity)
       ↓
ThemeManager.apply(cpIdx)
       ↓
state.theme  →  game.js (bg), renderer.js (arena, ui), hints.js (chain)
state.LEVELS →  toplar, slotlar, blast butonları
state.containerForm + state.gravity → physics + renderer
```

---

## Temel Mekanikler

### Top Düşürme
- Üstte bekleyen `nextBall` tıklanarak `heldBall`'a dönüştürülür
- `heldBall` sürüklenerek bırakılır; boşluğa tap ile direkt düşer
- `autoDropDeadline` (1 sn) dolunca otomatik düşer — `heldBall`'dan bağımsız

### Merge / Absorb (Manuel)
- **Otomatik yok** — sadece oyuncu drag ile tetikler
- Drag sırasında absorb/merge hedefine yaklaşınca: glow + halka (`absorbNear` / `mergeNear`)
- Bırakılınca `_tryInteract(dc)` → en yakın hedefe göre absorb veya merge
- `canAbsorb(big, small)`: `big.level > small.level`, fark == 1, ve şu koşul:
  - `big.contains` boşsa `small.level === big.level - 1`
  - `big.contains` doluysa `small.level === Math.min(...big.contains) - 1` ve `small.contains` boş olmalı

### Game Over
- Yeni top için üstte anlamlı boş yer bulunamazsa (penetrasyon > yarıçapın %40'ı) → 800ms sonra game over
- Çakışan toplar kırmızı pulse halo alır

### Hedefler (Goals)
- Her level 1–3 hedef slotu; eşleşen top slota uçar, tümü dolunca level tamamlanır
- Nested yapı desteklenir: `{ level: 4, contains: [3, 2] }`
- `levelStars`: 0 blast = 3★, 1 blast = 2★, 2+ blast = 1★

### Blast
- Arenayla aynı seviyedeki içi dolu topları etkileyen butonlar
- `BLAST_BTNS_TEMPLATE` şarjları: yellow=4, orange=3, green=2, blue=2, purple=1, red=1
- 120ms aralıklı ateşleme, en çok hedef içeren buton aktif olur
- Level 0-2'de gizli (`getMostCommonBtn` erken döner)

### Dünya Döndürme
- Arena dış halkasından sürükleyerek döndürülür, `rotVel` ile ivme kazanır
- `rotVel` clamp: ±0.08, sürtünme 0.90

---

## Level & Dünya Yapısı

| Yapı | Değer |
|------|-------|
| Tutorial | 1 (internal level 0) |
| Game level | 50 (5 CP × 10 level) |
| `TUTORIAL_LEVELS` (constants.js) | 1 |
| `LEVELS_PER_CP` (world-config.js) | 10 |
| `TOTAL_CHECKPOINTS` (world-config.js) | 5 |
| Şekil tipleri | sphere, jellybear, matrushka, duck, fish |

### CP içi level şablonu (5 varyant, `cpIdx % 5`)

Her CP için `_buildCpLevels(cpIdx, totalCp)` 10 level üretir. Ortak iskelet:
- **L1–L2**: 1 slotlu giriş (yavaş başla)
- **L3–L5**: 2 slotlu tırmanış (ısınma)
- **L6–L8**: 3 slotlu baskı (asıl zorluk)
- **L9–L10**: Boss

5 şablon farklı chain derinliği ve slot sırası kullanır:
- **A (v=0)** "Kademeli Tırmanış"
- **B (v=1)** "Sürpriz Sağ"
- **C (v=2)** "Üçlü Vurgu"
- **D (v=3)** "Dalgalı Nefes"
- **E (v=4)** "Büyüyen Baskı"

`baseLv` CP ilerledikçe artar: CP0→2, son CP→5. Son CP'de boss chain derinliği +1.

---

## World Config (`world-config.js`)

Her CP için tek kaynak. Şu an **5 checkpoint** tanımlı:

| CP | İsim | Shape | Container | bgColor | gravity |
|----|------|-------|-----------|---------|---------|
| 00 | Tatlı Uyanış | sphere | classicU | #0D1B4B | 0.28 |
| 01 | Limon Tarlası | jellybear | roundBowl | #F5FFFA | 0.35 |
| 02 | Nane Bahçesi | matrushka | tallNarrow | #c8ffe0 | 0.44 |
| 03 | Mavi Şeker | duck | goblet | #D1E9FF | 0.53 |
| 04 | Lavanta Rüyası | fish | vase | #EBDDFF | 0.64 |

### Kap Formları (`CONTAINER_FORMS`)

| Form | openFrac | topWidthFactor | Görünüm |
|------|----------|----------------|---------|
| classicU | 0.50 | 1.00 | Standart U |
| roundBowl | 0.32 | 1.00 | Geniş yuvarlak kase |
| tallNarrow | 0.68 | 1.00 | Dar uzun tüp |
| goblet | 0.667 | 1.40 | Üçgen kadeh (~120° alt açı, dışa açılır) |
| vase | 0.50 | 0.65 | Vazo (içe kapanır) |

`openFrac`: alt yay açısı katsayısı (× π). Küçük → geniş yuvarlak dip, büyük → dar uzun.
`topWidthFactor`: üst açıklık / junction genişliği oranı.
- `1.0` = dik duvar
- `>1` = dışa açılan (kadeh)
- `<1` = içe kapanan (vazo)

### Arka Plan Paletleri

Her CP'de `lightBg` (4 stop) tanımlı. `darkBg` ThemeManager içinde varsayılan değerle (`['#0D1B4B', '#091540', '#060F2E', '#030A1C']`) doldurulur:
- **Warm Sand** (CP 00, 03): `#F0E8D8 → #D9CAAB`
- **Dusty Lavender** (CP 01): `#EEE8F5 → #C4B8DA`
- **Soft Sage** (CP 02, 04): `#EFF5EC → #BCCFAF`

> Not: `world-config.js` yorum satırlarında 4 akt/20 CP planı var, ancak şu an sadece 5 CP aktif.

---

## Theme Manager (`theme.js`)

`world-config.js` veri deposu, `theme.js` dağıtıcısı.

```
apply(cpIdx)
  → getWorldConfig(cpIdx)
  → state.LEVELS = buildLevels(MAIN_R, palette, shape)
  → state.containerForm, state.gravity
  → state.theme = {
      cpIdx, name, bgColor, lightBg, darkBg, palette, shape,
      arenaBase: palette[6], accentMid: palette[3], accentLo: palette[1],
      bgTop, bgMid, bgBot,    // bgColor'dan palette[2]/[4] ile blend
      containerForm, gravity
    }
  → mevcut toplar ve blast butonlarının renklerini günceller
```

- `applyForLevel(internalLevel)`: CP değiştiyse `apply()`, değişmediyse sadece LEVELS yenile
- `reapplyAfterResize()`: resize sonrası LEVELS + renkler yenilenir

---

## Layout & Mobil Adaptasyon (`constants.js`)

### `buildLayout()`

- **`visualViewport` API**: Android Chrome/Samsung toolbar hariç gerçek yüksekliği alır (fallback: `window.innerWidth/innerHeight`)
- **DPR**: `Math.min(window.devicePixelRatio, 2)`
- **`S = MIN_DIM / 800`**: Tüm UI elemanları bu oranla ölçeklenir
- **`SCORE_AREA`**: `H`'ın yaklaşık %18–24'ü, üst sınır 220px
- **`BTN_PAD`**: `MIN_DIM * 0.025`, min 8
- **`safeBot`**: `env(safe-area-inset-bottom)` — iPhone home indicator / Android nav bar
- **`safeTop`**: `env(safe-area-inset-top)` — iPhone notch / Dynamic Island
- **`MAIN_R`**: `(W - SIDE_PAD*2) / 2` bazlı, alt buton yüksekliği + safe area çıkarılır
- CP geçişinde `_applyLayout()` yeniden çağrılır → form değişince MAIN_R adapte olur

### `index.html`
```css
height: 100vh;
height: 100dvh;
min-height: -webkit-fill-available;
```

---

## State (`state.js`)

Merkezi singleton. Önemli alanlar:

| Değişken | Açıklama |
|----------|----------|
| `canvas, ctx` | Canvas referansları |
| `W, H, CX, CY, MAIN_R, S` | Layout |
| `DPR, CSS_W, CSS_H, MIN_DIM, SCORE_AREA, safeTop` | Mobil layout |
| `LEVELS` | Mevcut CP'nin level renk+boyut listesi |
| `theme` | `ThemeManager.apply` ile dolduruluyor |
| `circles` | Arenадaki aktif toplar |
| `particles, chainWaves, absorbingInto` | Efekt buffer'ları |
| `blastAnims, blastBtnAnim` | Blast animasyonları |
| `nextBall, heldBall, draggedCircle` | Top akışı |
| `currentLevel` | Internal level (0 = tutorial) |
| `goalSlots, flyingGoals` | Hedef akışı |
| `levelSuccess, levelSuccessAlpha, levelStars` | Level tamamlama |
| `blastUsedThisLevel` | Yıldız hesabı için sayaç |
| `tut0Step, tut0Transitioning, _step1Spawned` | Tutorial adımı (0–3) |
| `gameOver, gameOverAlpha, isPaused, mapVisible` | Oyun durumu |
| `combo, comboTimer, lastComboFrame` | Combo sistemi |
| `autoDropTimer, autoDropDeadline` | Otomatik düşme |
| `frameCount, gameTime, lastSpawn` | Zamanlama |
| `worldRot, rotVel, lastAngle` | Dünya döndürme |
| `mousePos, prevMousePos, mouseVel` | Input |
| `BLAST_BTNS` | Buton state listesi |
| `audio` | Howler.js wrapper |
| `isMuted` | Ses durumu |
| `containerForm, gravity` | Mevcut CP form/yerçekim |
| `capParams` | Her frame `_draw()`'da hesaplanan kap parametreleri |

> Not: `isDarkMode` ve `_darkModeBtn` `state.js` initializer'ında yok — `game.js`'in init bloğunda `localStorage`'dan yükleniyor ve state'e ekleniyor. Aynı şekilde `isTutorial`, `tutDone`, `_nextBallBlocked` gibi alanlar runtime'da set ediliyor.

---

## Rendering (`renderer.js`)

Canvas 2D tabanlı. Pixi.js yalnızca harita ekranında kullanılır.

### Arka Plan
- Dark/light mod + CP'ye özgü radial gradient (`state.theme.darkBg` / `lightBg`)
- CP geçişinde otomatik değişir, `isDarkMode` toggle ile anlık değişir

### Kap (Arena)
- Tek sürekli path: alt yay → junction rounded köşe → duvar → üst rounded köşe → üst çizgi
- Junction ve üst köşelerde `quadraticCurveTo` ile yuvarlama (`cr = MAIN_R * 0.07`)
- Kap içi hafif koyu dolgu (dark modda daha yoğun)

### Butonlar (sağ üst, `safeTop` bazlı)
- **Pause**: `safeTop + ICON_PX/2 + 10`
- **Ses**: pause + `(ICON_PX + 6)`
- **Dark Mode**: pause + `(ICON_PX + 6) * 2`
- Dark modda: sarı ay hilali 🌙 | Light modda: turuncu güneş ☀️

### Toplar
- Level'a göre çok parçalı şekil (jellybear = gövde + kafa + kulaklar + kollar + ayaklar)
- Shape cache: aynı şekil/boyut/renk → `OffscreenCanvas`'ta önbellek
- Squish/boing aktifken cache devre dışı

### Timer Arc
- `isDarkMode` bazlı renk: koyu → beyaz, açık → koyu arc
- Son %30 → kırmızı urgency

### Diğer Efektler
- Partiküller, chain waves, flying goals, blast mermisi, combo display
- `_drawDragGlow(c)` — `absorbNear || mergeNear` → renk hale + halka

---

## Shape Sistemi

| Shape | CP | Notlar |
|-------|----|--------|
| sphere | 00 | Kawaii yüz (7 ifade) |
| jellybear | 01 | Jöle ayı, yarı saydam |
| matrushka | 02 | İç içe oval |
| duck | 03 | Büyük gaga, ayak |
| fish | 04 | Kuyruklu balık |

### Renderer geometrisi (`SHAPE_DEFS` — constants.js)

Her değer `c.r` çarpanı. Renderer çizimde, physics `_circles()`'da kullanır.
Tanımlı şekiller: `jellybear`, `bear`, `matrushka`, `duck`, `fish`. `sphere` özel def kullanmaz.

### Physics Collision (`_circles` — physics.js)

Renderer geometrisinin sadeleştirilmiş tek-daire yaklaşımı:

```
sphere:    (0,       0,       r)
jellybear: (0,      +0.05r,  0.90r)
bear:      (0,      +0.05r,  0.90r)
matrushka: (0,      +0.05r,  0.82r)
duck:      (+0.10r, -0.10r,  0.88r)
fish:      (-0.10r,  0,      1.00r)
```

> Not: Fish collision yarıçapı 1.00r (gövde + kuyruk + gaga birlikte örtülür).

---

## Fizik (`physics.js`)

- `RESTITUTION = 0.20`, `WALL_BOUNCE = 0.25` — düşük zıplama, stabil yığılma
- **`ITERS = 3`** — üç iterasyonlu position correction, yığılma çözümü
- `_clampToU`: shape'e göre efektif yarıçap (`er`) kullanır; `containerForm`'a göre yay/duvar bölgelerini ayrı işler
- `_containerParams()`: her clamp'ta `juncHW`, `juncY`, `topY`, `wallH` cache'lenir
- `_wallHW(y, params)`: y'ye göre efektif duvar genişliği (kadeh/vazo için lerp)
- Drag sırasında absorb/merge çifti yakındaysa itme `0.1x` (yumuşak temas)
- Kütle bazlı position correction: `m = r²`
- `updateAbsorbGlow()`: her 3 framede bir çalışır (performans)

---

## Tutorial (`tutorial.js`)

`TutorialManager` class. `state.isTutorial` ve `state.tutDone` flagleri ile yönetilir.

- `currentLevel === 0` iken `isTutorial = true`
- `tut0Step`: 0–3 arası adımlar (state.js'te `-1` ile başlar)
- `tut0Transitioning`: adım geçişlerinde animasyon kilidi
- `_step1Spawned`: ilk topun spawn edildiğini izler
- Tamamlanınca `state.tutDone = true` + `localStorage.setItem('matrushka_tutDone', '1')`
- `goals.js`: `state.isTutorial` ise `checkGoal` erken döner (success'i tutorial yönetir)

---

## Dark Mode

- `state.isDarkMode` ← `localStorage.getItem('matrushka_darkMode') !== 'false'`
- Varsayılan: `true` (dark)
- Toggle: dark mode butonu (renderer çizer) + tıklama handler (game.js)
- Arka plan, kap dolgu, timer arc rengi buna göre değişir

---

## Ses (`audio.js`)

Howler.js. Tab gizlenince auto-mute (Howler otomatik), görünür olunca `isMuted` durumuna göre geri açılır.

| Ses | Volume | Tetikleyici |
|-----|--------|-------------|
| `spawn` | 0.5 | Top arenaya düştüğünde |
| `pick` | 0.4 | Top pick edildiğinde |
| `merge` | 0.65 | İki top birleştiğinde |
| `absorb` | 0.6 | Top yutulduğunda |
| `combo` | 0.6 | Combo (rate ile pitch shift) |
| `blast` | 0.75 | Blast ateşlendiğinde |
| `goalDone` | 0.7 | Hedef tamamlandığında |
| `levelComplete` | 0.8 | Level tamamlandığında |
| `gameOver` | 0.7 | Game over tetiklendiğinde |

---

## Harita Ekranı (`map.js`)

Pixi.js tabanlı, canvastan bağımsız `div` içinde.

- Bézier eğrili yol, tamamlanan segmentler renkli
- CP geçişinde konfeti animasyonu
- İlerleme: `localStorage` (`matrushka_progress`)
- **`TEST_MODE = true`**: şu an aktif — tüm leveller açık görünüyor. Yayın öncesi `false` yapılmalı.

---

## Performans Notları

- Parçacık max 80
- `_sortedCircles` her 3 frame'de güncellenir
- Arena rengi (`_cachedArenaColor`) her 3 frame'de hesaplanır
- `updateAbsorbGlow` her 3 frame'de çalışır
- Shape cache: `OffscreenCanvas`, max 200 entry

---

## Teknik Kurallar

- `shadowBlur` **yasak** — titreme yaratır (blast mermisi hariç)
- Gradient arka plan **yasak** — `lightBg`/`darkBg` radial gradient kullan
- `world-config.js` tek veri kaynağı — CP renk/şekil/form buradan gelir
- `theme.js` dispatcher — modüller direkt `world-config` okumaz (istisna: `goals.js` ve `map.js` doğrudan import eder)

---

## Yapılacaklar

- [ ] **`TEST_MODE = false`** yapılmalı (`map.js:4`) — yayın öncesi
- [ ] `combo.wav` → MP3'e çevir (audio.js'te diğer hepsi mp3)
- [ ] Kap köşe junction asimetrisi kontrol edilmeli (farklı `openFrac` değerlerinde test)
- [ ] CP sayısı `world-config.js` yorum satırında 20 olarak planlanmış ama 5 tanımlı — genişletme veya yorumun güncellenmesi gerekiyor
- [ ] `darkBg` `world-config.js`'te tanımlanmıyor — her CP için kendi koyu paleti eklenebilir
