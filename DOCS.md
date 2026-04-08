# Matrushka — Proje Dokümantasyonu

## Genel Bakış

**Matrushka**, Canvas 2D tabanlı mobil hypercasual merge/puzzle oyunudur. Oyuncu top düşürerek aynı seviyedeki topları birleştirir, büyükleri küçükleri yutar. 50 level + 1 tutorial, 5 checkpoint'e bölünmüştür.

---

## Dosya Yapısı

```
matrushka/
├── index.html            — oyun girişi, MapScreen başlatır, Game açar
└── js/
    ├── state.js          — merkezi paylaşılan singleton state
    ├── constants.js      — buildLayout, LEVEL_RATIOS, SHAPE_DEFS, buildLevels
    ├── world-config.js   — TEK KAYNAK: 5 CP konfigürasyonu (palette, shape, bg, form, gravity)
    ├── game.js           — ana döngü, input, spawn, merge/absorb, dark mode
    ├── physics.js        — çarpışma, clampToU, duvar sınırları
    ├── renderer.js       — tüm Canvas 2D çizim işlemleri
    ├── goals.js          — hedef slot sistemi, flying goal animasyonu
    ├── blast.js          — blast butonu mekanikleri
    ├── hints.js          — hint chain çizimi
    ├── tutorial.js       — tutorial adım yönetimi (tut0Step 0-4)
    ├── audio.js          — Howler.js ses efektleri
    ├── theme.js          — ThemeManager: CP geçişinde state.theme dağıtır
    └── map.js            — Pixi.js harita ekranı (MapScreen class)
sounds/
    spawn.mp3, merge.mp3, absorb.mp3, combo.wav
    goalDone.mp3, levelComplete.mp3, gameOver.mp3, pick.mp3, blast.mp3
```

---

## Veri Akışı

```
world-config.js  (palette[7], lightBg[4], darkBg[4], shape, containerForm, gravity)
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
- `canAbsorb(big, small)`: `big.level > small.level`, fark == 1, `big.contains` boş

### Game Over
- Yeni top için üstte anlamlı boş yer bulunamazsa (penetrasyon > yarıçapın %40'ı) → 800ms sonra game over
- Çakışan toplar kırmızı pulse halo alır

### Hedefler (Goals)
- Her level 1–3 hedef slotu; eşleşen top slota uçar, tümü dolunca level tamamlanır
- Nested yapı desteklenir: `{ level: 4, contains: [3, 2] }`

### Blast
- Arenayla aynı seviyedeki topları etkileyen dinamit butonları
- Sınırlı şarj (level başına 1–4), 120ms aralıklı ateşleme

### Dünya Döndürme
- Arena dış halkasından sürükleyerek döndürülür, `rotVel` ile ivme kazanır

---

## Level & Dünya Yapısı

| Yapı | Değer |
|------|-------|
| Toplam level | 50 + 1 tutorial |
| Checkpoint sayısı | 5 |
| CP başına level | 10 |
| Şekil tipleri | sphere, jellybear, matrushka, duck, fish |

Level şablonu (CP başına):
- **L1–L2**: 1 slotlu giriş
- **L3–L5**: 2 slotlu ısınma
- **L6–L8**: 3 slotlu baskı
- **L9–L10**: Boss level

---

## World Config (`world-config.js`)

Her CP için tek kaynak. 5 checkpoint:

| CP | İsim | Shape | Container | lightBg | darkBg |
|----|------|-------|-----------|---------|--------|
| 00 | Tatlı Uyanış | sphere | classicU | Warm Sand | Deep Navy |
| 01 | Limon Tarlası | jellybear | roundBowl | Dusty Lavender | Deep Plum |
| 02 | Nane Bahçesi | matrushka | tallNarrow | Soft Sage | Dark Forest |
| 03 | Mavi Şeker | duck | goblet | Warm Sand | Deep Navy |
| 04 | Lavanta Rüyası | fish | vase | Soft Sage | Dark Forest |

### Kap Formları (`CONTAINER_FORMS`)

| Form | openFrac | topWidthFactor | Görünüm |
|------|----------|----------------|---------|
| classicU | 0.50 | 1.00 | Standart U |
| roundBowl | 0.32 | 1.00 | Geniş yuvarlak kase |
| tallNarrow | 0.68 | 1.00 | Dar uzun tüp |
| goblet | 0.50 | 1.20 | Kadeh (dışa açılır) |
| vase | 0.50 | 0.65 | Vazo (içe kapanır) |

Her CP'nin `containerForm`'una göre `MAIN_R` dinamik ölçeklenir — kap kenarı ekrandan taşmaz.

### Arka Plan Renkleri

Her CP'de `lightBg` (4 stop) ve `darkBg` (4 stop) tanımlıdır:
- **Warm Sand**: `#F0E8D8 → #D9CAAB`
- **Dusty Lavender**: `#EEE8F5 → #C4B8DA`
- **Soft Sage**: `#EFF5EC → #BCCFAF`
- **Deep Navy**: `#0D1B4B → #030A1C`
- **Deep Plum**: `#1A0A2E → #06020C`
- **Dark Forest**: `#071A10 → #010603`

---

## Theme Manager (`theme.js`)

`world-config.js` veri deposu, `theme.js` dağıtıcısı.

```
apply(cpIdx)
  → getWorldConfig(cpIdx)
  → state.LEVELS = buildLevels(MAIN_R, palette, shape)
  → state.containerForm, state.gravity
  → state.theme = { cpIdx, name, bgColor, lightBg, darkBg, palette,
                    shape, arenaBase, accentMid, accentLo,
                    containerForm, gravity }
  → mevcut toplar ve blast butonlarının renklerini güncelle
```

- `applyForLevel(internalLevel)`: CP değiştiyse `apply()`, değişmediyse sadece LEVELS yenile
- `reapplyAfterResize()`: resize sonrası LEVELS + renkler yenilenir

---

## Layout & Mobil Adaptasyon (`constants.js`)

### `buildLayout()`

- **`visualViewport` API**: Android Chrome/Samsung toolbar hariç gerçek yüksekliği alır
- **DPR**: Max 2 (performans)
- **`S = MIN_DIM / 800`**: Tüm UI elemanları bu oranla ölçeklenir
- **`SCORE_AREA`**: `H`'ın %18–24'ü
- **`safeBot`**: `env(safe-area-inset-bottom)` — iPhone home indicator / Android nav bar
- **`safeTop`**: `env(safe-area-inset-top)` — iPhone notch / Dynamic Island
- **`MAIN_R`**: `(W - SIDE_PAD*2) / 2` bazlı — kap formu taşmaz
- CP geçişinde `_applyLayout()` yeniden çağrılır → form değişince MAIN_R adapte olur

### `index.html`
```css
height: 100vh;
height: 100dvh;
min-height: -webkit-fill-available;
```

---

## State (`state.js`)

| Değişken | Açıklama |
|----------|----------|
| `circles` | Arenадaki aktif toplar |
| `nextBall` | Üstte bekleyen önizleme topu |
| `heldBall` | Oyuncunun sürüklediği top |
| `draggedCircle` | Arenada elle sürüklenen mevcut top |
| `gameOver` | Oyun bitti durumu |
| `levelSuccess` | Level tamamlandı |
| `goalSlots` | Hedef slot durumları |
| `combo / comboTimer` | Merge streak sayacı |
| `autoDropDeadline` | Otomatik düşme zamanı (ms) |
| `BLAST_BTNS` | Blast buton durumları ve şarjlar |
| `isPaused / isMuted` | Pause ve ses durumu |
| `isDarkMode` | Dark/light mod (localStorage'da saklanır) |
| `_nextBallBlocked` | Yeni topun boş yer bulamadığı durum |
| `_darkModeBtn` | Dark mode buton hit area |
| `safeTop` | Üst safe area inset (px) |
| `containerForm` | Mevcut CP kap formu |
| `gravity` | Mevcut CP yerçekimi |

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

### Physics Collision (`_circles`)
```
sphere:    (0,      0,       r)
jellybear: (0,    +0.05r, 0.90r)
matrushka: (0,    +0.05r, 0.82r)
duck:      (+0.10r, -0.10r, 0.88r)
fish:      (-0.10r,  0,    0.88r)
```

---

## Fizik (`physics.js`)

- `RESTITUTION = 0.20`, `WALL_BOUNCE = 0.25` — düşük zıplama, stabil yığılma
- `ITERS = 1` — tek iterasyon, titreme önleme
- `_clampToU`: shape'e göre efektif yarıçap (`er`) kullanır
- Drag sırasında absorb/merge çifti → itme `0.1x`

---

## Dark Mode

- `state.isDarkMode` → `localStorage.getItem('matrushka_darkMode')`
- Varsayılan: `true` (dark)
- Toggle: dark mode butonu (renderer) + tıklama handler (game.js)
- Arka plan, kap dolgu, timer arc rengi buna göre değişir

---

## Ses (`audio.js`)

Howler.js. Tab gizlenince auto-mute, görünür olunca `isMuted` durumuna göre geri açılır.

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

## Harita Ekranı (`map.js`)

Pixi.js tabanlı, canvastan bağımsız `div` içinde.

- Bézier eğrili yol, tamamlanan segmentler renkli
- CP geçişinde konfeti animasyonu
- İlerleme: `localStorage` (`matrushka_progress`)

---

## Performans Notları

- Parçacık max 80
- `_sortedCircles` her 3 frame'de güncellenir
- Arena rengi (`_cachedArenaColor`) her 3 frame'de hesaplanır
- Shape cache: `OffscreenCanvas`, max 200 entry

---

## Teknik Kurallar

- `shadowBlur` **yasak** — titreme yaratır (blast mermisi hariç)
- Gradient arka plan **yasak** — `lightBg`/`darkBg` radial gradient kullan
- `world-config.js` tek veri kaynağı — CP renk/şekil/form buradan gelir
- `theme.js` dispatcher — modüller direkt world-config okumaz

---

## Yapılacaklar

- [ ] Tutorial yeniden yazılmalı — manuel merge/absorb mekaniğini göstermeli
- [ ] `TEST_MODE = false` yayın öncesi
- [ ] `combo.wav` → MP3'e çevir
- [ ] Kap köşe junction asimetrisi kontrol edilmeli (farklı openFrac değerlerinde test)
