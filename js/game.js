// ── game.js ───────────────────────────────────────────────────────
import { state } from './state.js';
import { buildLayout, buildLevels, BLAST_BTNS_TEMPLATE, TUTORIAL_LEVELS } from './constants.js';
import { AudioManager } from './audio.js';
import { PhysicsManager } from './physics.js';
import { GoalManager } from './goals.js';
import { BlastManager } from './blast.js';
import { HintManager } from './hints.js';
import { TutorialManager } from './tutorial.js';
import { Renderer } from './renderer.js';
import { LEVELS_PER_CP, levelFromCpIdx, cpIdxFromLevel, getWorldConfig } from './world-config.js';
import { ThemeManager } from './theme.js';

export class Game {
  constructor(canvas) {
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');

    this.audio    = new AudioManager();
    state.audio   = this.audio;
    this.physics  = new PhysicsManager();
    this.goals    = new GoalManager();
    this.blast    = new BlastManager();
    this.hints    = new HintManager();
    this.tutorial = new TutorialManager();
    this.renderer = new Renderer();
    this.theme    = new ThemeManager();

    this._applyLayout();
    this._setupInput();
    window.addEventListener('resize', () => { this._applyLayout(); });
    // Samsung / Android Chrome: toolbar gizlenince visualViewport resize tetiklenir
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => { this._applyLayout(); });
    }
    // Başlangıçta ses açık
    if (typeof Howler !== 'undefined') Howler.mute(false);

    // Dark mode — localStorage'dan oku, varsayılan: dark
    state.isDarkMode = localStorage.getItem('matrushka_darkMode') !== 'false';

    // Arka plana geçince pause, öne gelince devam
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._wasPlayingBeforeHide = !state.isPaused;
        if (!state.isPaused) state.isPaused = true;
        // Howler ses akışını durdur
        if (typeof Howler !== 'undefined') Howler.mute(true);
      } else {
        if (this._wasPlayingBeforeHide) state.isPaused = false;
        // isMuted durumunu koru
        if (typeof Howler !== 'undefined') Howler.mute(state.isMuted);
      }
    });
  }

  // ── Dünya paleti ─────────────────────────────────────────────────
  // Tema ThemeManager'a devredildi

  // ── Layout ────────────────────────────────────────────────────────
  _applyLayout() {
    const L = buildLayout();
    Object.assign(state, L);

    // Forma göre MAIN_R scale — portrait'ta dar marj, landscape'te geniş
    const form = state.containerForm;
    if (form) {
      const formMargin = L.W < L.H ? 2 : 16; // portrait: kenara yapışık
      const maxHalfW = (L.W - formMargin * 2) / 2;
      const spread   = Math.max(Math.sin((form.openFrac ?? 0.5) * Math.PI), form.topWidthFactor ?? 1);
      const maxRbyForm = Math.floor(maxHalfW / spread);
      if (maxRbyForm < state.MAIN_R) {
        state.MAIN_R = maxRbyForm;
        const bottomRoom = L.H - L.CY - L.MAIN_R;
        state.CY = Math.round(L.SCORE_AREA + state.MAIN_R +
          (L.H - L.SCORE_AREA - bottomRoom - state.MAIN_R * 2) / 2);
      }
    }

    // capParams'ı hemen güncelle — physics ilk frame'de doğru okusun
    this._computeCapParams?.();

    this.theme?.reapplyAfterResize();
    const { canvas, ctx } = state;
    canvas.width  = Math.round(L.CSS_W * L.DPR);
    canvas.height = Math.round(L.CSS_H * L.DPR);
    canvas.style.width  = L.CSS_W + 'px';
    canvas.style.height = L.CSS_H + 'px';
    ctx.setTransform(L.DPR, 0, 0, L.DPR, 0, 0);
    state.mousePos     = { x: state.CX, y: state.CY };
    state.prevMousePos = { x: state.CX, y: state.CY };
  }

  // ── Input ─────────────────────────────────────────────────────────
  _setupInput() {
    const { canvas } = state;
    canvas.addEventListener('mousedown',  e => this._onDown(e));
    canvas.addEventListener('mousemove',  e => this._onMove(e));
    canvas.addEventListener('touchstart', e => this._onDown(e), { passive: false });
    canvas.addEventListener('touchmove',  e => this._onMove(e), { passive: false });
    window.addEventListener('mouseup',    e => this._onUp(e));
    window.addEventListener('touchend',   e => this._onUp(e));
    window.addEventListener('touchcancel',e => this._onUp(e));
  }

  _getPos(e) {
    const rect = state.canvas.getBoundingClientRect();
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    if (touch) return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _onDown(e) {
    e.preventDefault();
    const { x, y } = this._getPos(e);
    state.mousePos = { x, y };
    this.audio.unlock();

    // Pause overlay — her durumda (gameOver dahil) önce kontrol et
    const rb = state._resumeBtn;
    if (rb && x >= rb.x && x <= rb.x + rb.w && y >= rb.y && y <= rb.y + rb.h) {
      state.isPaused = false; return;
    }

    // levelSuccess: sadece next level butonuna izin ver
    if (state.levelSuccess) {
      const nlb = state._nextLevelBtn;
      if (nlb && nlb.a > 0.5 && x >= nlb.x && x <= nlb.x + nlb.w && y >= nlb.y && y <= nlb.y + nlb.h) {
        this._nextLevel();
      }
      return;
    }

    if (state.gameOver) {
      const gb = state._gameOverBtn;
      if (gb && x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) this._restartCurrentLevel();
      return;
    }

    const sb = state._soundBtn;
    if (sb && x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
      state.isMuted = !state.isMuted;
      if (typeof Howler !== 'undefined') Howler.mute(state.isMuted);
      return;
    }
    // Dark mode switch butonu
    const db = state._darkModeBtn;
    if (db && x >= db.x && x <= db.x + db.w && y >= db.y && y <= db.y + db.h) {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem('matrushka_darkMode', state.isDarkMode);
      return;
    }
    // Tutorial popup butonu — PLAY! → direkt Level 1 (map atlanır)
    // Map sadece "her 10 levelda kutlama" ve "uygulama açılışı" için açılır.
    const tpb = state._tutPopupBtn;
    if (state.tutShowPopup && tpb && x >= tpb.x && x <= tpb.x + tpb.w && y >= tpb.y && y <= tpb.y + tpb.h) {
      state.tutShowPopup = false;
      state.isTutorial   = false;
      state.tutDone      = true;
      localStorage.setItem('matrushka_tutDone', '1');
      // Map açıksa kapat — gameplay'e geç
      if (window._matrushkaMap && typeof window._matrushkaMap.hide === 'function') {
        window._matrushkaMap.hide();
      }
      if (state.canvas) state.canvas.style.display = 'block';
      // "?" ile açıldıysa kaydedilen level'a dön, yoksa ilk gerçek level
      const returnLevel = (state._savedLevel != null && state._savedLevel >= TUTORIAL_LEVELS)
        ? state._savedLevel
        : TUTORIAL_LEVELS;
      state._savedLevel = null;
      this.startFromLevel(returnLevel);
      return;
    }
    // Tutorial butonu — toggle: ilk basışta tutorial aç, ikinci basışta önceki level'a dön
    const tb = state._tutorialBtn;
    if (tb && x >= tb.x && x <= tb.x + tb.w && y >= tb.y && y <= tb.y + tb.h) {
      if (state.currentLevel === 0 && state._savedLevel != null) {
        // Tutorial içinde → kaldığı level'a dön
        const saved = state._savedLevel;
        state._savedLevel = null;
        this._startFromLevel(saved);
      } else {
        // Mevcut level'ı kaydet, tutorial baştan
        state._savedLevel = state.currentLevel;
        this._startFromLevel(0);
      }
      return;
    }
    const hb = state._homeBtn;
    if (hb && x >= hb.x && x <= hb.x + hb.w && y >= hb.y && y <= hb.y + hb.h) {
      state.isPaused = false;
      state.gameOver = false;
      state.gameOverAlpha = 0;
      state.levelSuccess = false;
      state.levelSuccessAlpha = 0;
      state.circles = [];
      state.particles = [];
      state.nextBall = null;
      if (window._matrushkaMap && typeof window._matrushkaMap.show === 'function') {
        window._matrushkaMap.show();
      }
      return;
    }
    const pb = state._pauseBtn;
    if (pb && x >= pb.x && x <= pb.x + pb.w && y >= pb.y && y <= pb.y + pb.h) {
      state.isPaused = !state.isPaused;
      return;
    }
    if (state.isPaused) return;

    state.mainBorderFlash = 30;

    // Blast butonu
    const bRect = this.blast.getBtnRect();
    if (bRect && x >= bRect.x && x <= bRect.x + bRect.w && y >= bRect.y && y <= bRect.y + bRect.h * 1.2) {
      if (this.blast.isEnabled(bRect)) this.blast.fire(bRect, this.audio);
      return;
    }

    const { CX, CY, MAIN_R, S } = state;

    // Mevcut topa dokunuldu → sürükle
    // En küçük r öncelikli — büyük obje küçüğün önüne geçmesin
    const touched = state.circles
      .filter(c => Math.hypot(x - c.x, y - c.y) < Math.max(c.r * 1.1, 36 * S))
      .sort((a, b) => a.r - b.r)[0] || null;
    if (touched) {
      state.draggedCircle = touched;
      touched.isBeingDragged = true;
      state._dragLockedTarget = null;
      this.audio.pick();
      return;
    }

    // heldBall varsa: tıklanan X hizasından tepeden düşür
    if (state.heldBall) {
      this._dropBallFromTop(x);
      return;
    }

    // nextBall'a dokunuldu → sürüklenebilir heldBall oluştur
    if (state.nextBall && !state.heldBall) {
      const nb = state.nextBall;
      if (Math.hypot(x - nb.x, y - nb.y) < Math.max(nb.r * 1.8, 44 * S)) {
        state.heldBall = { ...nb, x, y };
        state.nextBall = null;
        state._nextBallBlocked = false;
        state.autoDropDeadline = 0;
        this.audio.pick();
        // Beklemesiz: yeni nextBall ANINDA üretilsin (eski: remaining ms beklerdi)
        if (!state.levelSuccess && !state.gameOver && !state.nextBall) this._generateNextBall();
        return;
      }
    }

    // Boş alana tap + nextBall → tıklanan X hizasından direkt düşür
    if (state.nextBall && !state.heldBall) {
      const _dy = y - CY;
      const _inU = _dy >= 0
        ? Math.hypot(x - CX, _dy) <= MAIN_R
        : (x >= CX - MAIN_R && x <= CX + MAIN_R && y >= CY - MAIN_R);
      if (_inU) {
        const nb = state.nextBall;
        state.nextBall = null;
        const dropX = Math.max(CX - MAIN_R + nb.r + 2, Math.min(CX + MAIN_R - nb.r - 2, x));
        const dropY = CY - MAIN_R + nb.r + 2;
        const ball = this._makeBallObj(nb.level, dropX, dropY);
        ball.vy = 2;
        state.circles.push(ball);
        this._checkSpawnCollision(ball);
        state._lastDropX = dropX;
        this.audio.spawn();
        // Beklemesiz: yeni nextBall ANINDA üretilsin (eski: 300ms beklerdi)
        if (!state.levelSuccess && !state.gameOver && !state.nextBall) this._generateNextBall();
        return;
      }
    }

    // Dünya döndürme
    if (Math.hypot(x - CX, y - CY) > MAIN_R - 55 * S) {
      state.isDraggingWorld = true;
      state.lastAngle = Math.atan2(y - CY, x - CX);
    }
  }

  _onMove(e) {
    e.preventDefault();
    const { x, y } = this._getPos(e);
    state.mouseVel.x = x - state.mousePos.x;
    state.mouseVel.y = y - state.mousePos.y;
    state.prevMousePos = { x: state.mousePos.x, y: state.mousePos.y };
    state.mousePos = { x, y };
    if (state.draggedCircle) {
      const c = this._clampToCapBounds(x, y, state.draggedCircle.r);
      state.mousePos = { x: c.x, y: c.y };
    }
    if (state.heldBall) {
      const c = this._clampToCapBounds(x, y, state.heldBall.r);
      state.heldBall.x = c.x; state.heldBall.y = c.y;
    }

    if (state.isDraggingWorld) {
      const { CX, CY } = state;
      const curA = Math.atan2(y - CY, x - CX);
      let delta = curA - state.lastAngle;
      if (delta > Math.PI)  delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      const cos = Math.cos(delta), sin = Math.sin(delta);
      for (const c of state.circles) {
        if (c.isBeingDragged) continue;
        const dx = c.x - CX, dy = c.y - CY;
        c.x = CX + dx * cos - dy * sin;
        c.y = CY + dx * sin + dy * cos;
      }
      state.worldRot += delta;
      state.rotVel = Math.max(-0.08, Math.min(0.08, delta));
      state.lastAngle = curA;
    }
  }

  _onUp(e) {
    if (state.heldBall) {
      // Oyuncu sürükleyip bıraktı → bırakılan yerden serbest düşüş
      this._dropBallAtPos(state.heldBall.x, state.heldBall.y);
      return;
    }

    if (state.draggedCircle) {
      const dc = state.draggedCircle;
      dc.isBeingDragged = false;
      dc.vx = 0; dc.vy = 0;
      dc.absorbNear = false;
      state._dragLockedTarget = null;
      this.physics._clampToU(dc);
      this._tryInteract(dc);
      state.draggedCircle = null;
    }
    state.mouseVel = { x: 0, y: 0 };
    state.isDraggingWorld = false;
  }

  // ── Başlat / Sıfırla ──────────────────────────────────────────────
  // index.html'den çağrılır — cpIdx: seçilen checkpoint
  startFromCheckpoint(cpIdx) {
    const internalLevel = cpIdx === 0
      ? 0
      : levelFromCpIdx(cpIdx, TUTORIAL_LEVELS);
    this._loopId = (this._loopId || 0) + 1;
    const myId = this._loopId;
    this._startFromLevel(internalLevel);
    requestAnimationFrame(() => this._loop(myId));
  }

  // Map'ten çağrılır — li+1 gelir (li=0 → internalLevel=1)
  // Ayrıca PLAY! butonundan da çağrılır (tutorial → Level 1 geçişi).
  // ÇİFT LOOP FIX: Önceki implementasyon `_loopStopped = true; ... = false;`
  // ile race oluşturuyordu — eski rAF kuyruğa girmiş kalıyor, yeni rAF da ekleniyordu
  // → iki paralel loop her frame _update'i çift çağırıyor → toplar 2x hızlı.
  // Çözüm: monotonic _loopId — sadece güncel ID'ye sahip loop devam eder.
  startFromLevel(internalLevel) {
    if (state.canvas) state.canvas.style.display = 'block';
    this._loopId = (this._loopId || 0) + 1; // eski loop'ları geçersizleştir
    const myId = this._loopId;
    this._startFromLevel(internalLevel);
    requestAnimationFrame(() => this._loop(myId));
  }

  // Eski start() — geriye dönük uyumluluk
  start() {
    this.startFromCheckpoint(0);
  }

  _getProgress() {
    try { return JSON.parse(localStorage.getItem('matrushka_progress') || '{}'); }
    catch(e) { return {}; }
  }

  _startFromLevel(internalLevel) {
    state.currentLevel      = internalLevel;
    state.circles           = []; state._sortedCircles = null;
    state.particles         = [];
    state.blastAnims        = [];
    state.absorbingInto     = [];
    state.chainWaves        = [];
    state.actionTexts       = [];
    state.comboDisplays     = [];
    state.BLAST_BTNS        = BLAST_BTNS_TEMPLATE.map(b => ({ ...b, charges: b.maxCharges }));
    state.combo             = 0;
    state.comboTimer        = 0;
    state.gameOver          = false;
    state.gameOverAlpha     = 0;
    state.levelSuccess      = false;
    state.levelSuccessAlpha = 0;
    state.levelStars        = 0;
    state.isPaused          = false;
    state.lastSpawn         = 0;
    state.introDropsDone    = false;
    state.blastUsedThisLevel = 0;
    state.isTutorial        = (state.currentLevel === 0);
    state.tutStep           = 0;
    state.tutDone           = false;
    state._nextLevelBtn     = null;
    state._gameOverBtn      = null;
    this.theme.applyForLevel(internalLevel);
    this._applyLayout();
    this.goals.initLevelGoals();
    this._preloadArena();
    state.nextBall = null; state.heldBall = null; state._nextBallBlocked = false;
    state.autoDropDeadline = 0;
    state.paletteGuideStart = Date.now();
    if (!state.isTutorial) {
      // Açılış animasyonları (~640ms) bittikten sonra ilk topu üret
      const _startLv = state.currentLevel;
      setTimeout(() => {
        if (state.currentLevel !== _startLv) return;
        if (!state.levelSuccess && !state.gameOver) this._generateNextBall();
      }, 680);
    }
  }

  _restartCurrentLevel() {
    const lvl = state.currentLevel; // mevcut level'ı sakla
    this._startFromLevel(lvl);
  }

  _resetGame() {
    state.circles        = [];
    state.particles      = [];
    state.blastAnims     = [];
    state.absorbingInto  = [];
    state.chainWaves     = [];
    state.actionTexts    = [];
    state.comboDisplays  = [];
    state.BLAST_BTNS     = BLAST_BTNS_TEMPLATE.map(b => ({ ...b, charges: b.maxCharges }));
    state.combo          = 0;
    state.comboTimer     = 0;
    state.currentLevel   = 0;
    state.gameOver       = false;
    state.gameOverAlpha  = 0;
    state.lastSpawn      = 0;
    state.introDropsDone = false;
    state.blastUsedThisLevel = 0;
    state.isTutorial        = false;
    state.tutStep           = 0;
    state.tutDone           = false;
    state._nextLevelBtn  = null;
    state._gameOverBtn   = null;
    // _preloadArena ve goals.init _startFromLevel tarafından çağrılır
  }

  _nextLevel() {
    const nextLevel = state.currentLevel + 1;
    const completedGameLevels = nextLevel - TUTORIAL_LEVELS; // Tutorial hariç
    const isCheckpoint = completedGameLevels > 0 && completedGameLevels % LEVELS_PER_CP === 0;

    if (isCheckpoint) {
      const cpIdx = Math.floor(completedGameLevels / LEVELS_PER_CP) - 1;
      // index.html üzerinden map'e eriş
      if (window._matrushkaMap) {
        window._matrushkaMap.showCheckpoint(cpIdx, () => {
          this._doNextLevel(nextLevel);
        });
      } else {
        this._doNextLevel(nextLevel);
      }
      return;
    }
    this._doNextLevel(nextLevel);
  }

  _doNextLevel(nextLevel) {
    state.currentLevel = nextLevel;
    state.circles        = [];
    state.particles      = [];
    state.blastAnims     = [];
    state.absorbingInto  = [];
    state.chainWaves     = [];
    state.actionTexts    = [];
    state.comboDisplays  = [];
    state.BLAST_BTNS     = BLAST_BTNS_TEMPLATE.map(b => ({ ...b, charges: b.maxCharges }));
    state.combo          = 0;
    state.comboTimer     = 0;
    state.lastSpawn      = 0;
    state.blastUsedThisLevel = 0;
    // Overlay state'lerini tam sıfırla — level geçişinde stale overlay kalmasın
    state.levelSuccess      = false;
    state.levelSuccessAlpha = 0;
    state.levelStars        = 0;
    state.gameOver          = false;
    state.gameOverAlpha     = 0;
    state.isPaused          = false;
    state._nextLevelBtn     = null;
    state._gameOverBtn      = null;
    // currentLevel artık tutorial değilse isTutorial false olmalı
    state.isTutorial        = (state.currentLevel === 0);
    // Success kartı animasyon state'ini sıfırla — sonraki level success ekranı
    // baştan elastic scale-in ile açılsın
    if (this.tutorial && typeof this.tutorial.resetCardState === 'function') {
      this.tutorial.resetCardState('success');
    }
    this.theme.applyForLevel(nextLevel);
    this._applyLayout();
    this.goals.initLevelGoals();
    this._preloadArena();
    // İlk topu üret (tutorial değilse) — beklemesiz (eski: 600ms beklerdi)
    state.nextBall = null; state.heldBall = null; state._nextBallBlocked = false;
    if (!state.isTutorial) {
      this._generateNextBall();
    }
  }

  // ── Arena ön yükleme ──────────────────────────────────────────────
  _dropSequential(seq, onDone) {
    const { CX, CY, MAIN_R, LEVELS } = state;
    let idx = 0;
    const dropNext = () => {
      if (state.gameOver || state.levelSuccess) return;
      if (idx >= seq.length) { onDone(); return; }
      const { lv, xOff } = seq[idx++];
      const lr = LEVELS[lv].r;
      const spawnX = CX + xOff, dx2 = spawnX - CX;
      const spawnY = CY - Math.sqrt(Math.max(0, (MAIN_R - lr - 2) ** 2 - dx2 ** 2));
      const ball = { id: Math.random(), x: spawnX, y: spawnY, r: lr, level: lv, color: LEVELS[lv].color, vx: 0, vy: LEVELS[lv].vy, contains: [], absorbAnim: 0, isBeingDragged: false, boing: 0, absorbGlow: 0 };
      state.circles.push(ball);
      const wait = setInterval(() => {
        if (state.gameOver || state.levelSuccess) { clearInterval(wait); return; }
        const found = state.circles.find(c => c.id === ball.id);
        if (!found || Math.abs(found.vy) < 0.8) { clearInterval(wait); setTimeout(dropNext, 300); }
      }, 50);
    };
    setTimeout(dropNext, 400);
  }

  _preloadArena() {
    state.circles = []; state.introDropsDone = false;
    if (state.currentLevel === 0) {
      state.isTutorial = true;
      state.tutStep    = 0;
      state.tutDone    = false;
      this.tutorial.startStep(0);
      return;
    }
    state.introDropsDone = true;
  }

  // ── Top üretimi (sürükle-bırak sistemi) ─────────────────────────
  _countLevel0() {
    let n = 0;
    for (const c of state.circles) {
      if (c.level === 0) n++;
      if (c.contains) n += c.contains.filter(lv => lv === 0).length;
    }
    return n;
  }

  _randomBallLevel() {
    const { LEVELS, currentLevel } = state;
    const def = this.goals.getLevelDef();

    // Goal'lardan en küçük iç halka seviyesini bul (temel hammadde)
    let minInner = 999;
    for (const g of def.goals) {
      const inner = g.contains.length ? g.contains[g.contains.length - 1] : g.level;
      if (inner < minInner) minInner = inner;
    }
    if (minInner === 999) minInner = 0;

    // CP içindeki konum (0–9): zorluk kademesini belirler
    const posIdx = Math.max(0, (currentLevel - 1) % 10);

    // Konum bazlı genişlik: erken levellarda küçük toplar, boss'ta geniş aralık
    const rawCap = posIdx <= 1 ? 1   // L1–2: sadece minInner+1
                 : posIdx <= 5 ? 2   // L3–6: minInner+2
                 :               3;  // L7–10: minInner+3
    const maxSpawn = Math.max(minInner, Math.min(LEVELS.length - 1, minInner + rawCap));

    // Ağırlıklı havuz: küçük toplar ağırlıklı, büyükler giderek seyrek
    const pool = [];
    for (let i = 0; i <= maxSpawn; i++) {
      const w = i < minInner
        ? 1                                // ön-dolgu: nadir
        : Math.max(1, maxSpawn - i + 3);   // minInner en ağır, yukarısı azalır
      for (let j = 0; j < w; j++) pool.push(i);
    }

    const last = state._lastSpawnLevel ?? -1;
    const candidates = pool.length > 1 ? pool.filter(l => l !== last) : pool;
    const lv = candidates[Math.floor(Math.random() * candidates.length)];
    state._lastSpawnLevel = lv;
    return lv;
  }

  _makeBallObj(lv, x, y) {
    const { LEVELS } = state;
    return {
      id: Math.random(), x, y,
      r: LEVELS[lv].r, level: lv,
      color: LEVELS[lv].color,
      vx: 0, vy: LEVELS[lv].vy,
      contains: [], absorbAnim: 0,
      isBeingDragged: false, boing: 0, absorbGlow: 0,
      spawnTime: Date.now()
    };
  }

  // Spawn collision check — artık game over tetiklemez
  _checkSpawnCollision(_ball) {
    // Game over yalnızca _generateNextBall'da boş yer kalmadığında tetiklenir
  }

  // İki top arasında ciddi örtüşme var mı?
  // Penetrasyon (nüfuz derinliği) yeni topun yarıçapının %40'ından fazlaysa — "ciddi çakışma"
  _significantOverlap(cx, cy, r, c) {
    if (c.isBeingDragged) return false;
    const dist = Math.hypot(cx - c.x, cy - c.y);
    return (c.r + r - dist) > r * 0.4;
  }

  // Üst açıklığın efektif yarı-genişliği — container form'a göre
  _topHalfWidth() {
    return state.capParams?.topHW ?? (state.MAIN_R * 0.9);
  }

  // Üst açıklık içinde boş yer bul ve topu oraya yerleştir
  _generateNextBall() {
    if (state.isTutorial) return;
    const lv = this._randomBallLevel();
    const { CX, CY, MAIN_R, LEVELS } = state;
    const r = LEVELS[lv].r;
    const topY = CY - MAIN_R + r + 2;
    const topHW = this._topHalfWidth();
    const xMin = CX - topHW + r + 2;
    const xMax = CX + topHW - r - 2;

    // Üst çizgi boyunca boş noktaları tara
    const step = r * 0.5;
    const emptySpots = [];
    for (let cx = xMin; cx <= xMax; cx += step) {
      const blocked = state.circles.some(c => this._significantOverlap(cx, topY, r, c));
      if (!blocked) emptySpots.push(cx);
    }

    const lastX = state._lastDropX ?? null;
    let nx;
    let isBlocked = false;

    if (emptySpots.length > 0) {
      if (lastX !== null && emptySpots.length > 1) {
        emptySpots.sort((a, b) => Math.abs(b - lastX) - Math.abs(a - lastX));
        const half = Math.ceil(emptySpots.length / 2);
        nx = emptySpots[Math.floor(Math.random() * half)];
      } else {
        nx = emptySpots[Math.floor(Math.random() * emptySpots.length)];
      }
    } else {
      // Boş yer yok — ortaya koy, görünsün, game over tetikle
      nx = CX;
      isBlocked = true;
    }

    state.nextBall = { level: lv, r, x: nx, y: topY };
    state._nextBallBlocked = isBlocked;
    state.autoDropDeadline = isBlocked ? 0 : Date.now() + 1000;

    if (isBlocked && !state.levelSuccess) {
      const blockedLevel = state.currentLevel;
      setTimeout(() => {
        if (state.levelSuccess || state.gameOver) return;
        if (state.currentLevel !== blockedLevel) return;
        if (!state._nextBallBlocked) return;
        state.gameOver = true;
        this.audio.gameOver();
      }, 800);
    }
  }

  // Boş alana tıklama: tıklanan X hizasından U'nun tepesinden düşür
  _dropBallFromTop(clickX) {
    if (!state.heldBall) return;
    const { CX, CY, MAIN_R } = state;
    const hb = state.heldBall;
    const dropX = Math.max(CX - MAIN_R + hb.r + 2, Math.min(CX + MAIN_R - hb.r - 2, clickX));
    const dropY = CY - MAIN_R + hb.r + 2;
    const ball = this._makeBallObj(hb.level, dropX, dropY);
    ball.vy = 2;
    // Spawn noktasında başka top varsa game over
    state.circles.push(ball);
    this._checkSpawnCollision(ball);
    state._lastDropX = dropX;
    this.audio.spawn();
    state.heldBall = null;
    // Kısa gecikme: düşen top spawn bölgesini geçsin, sonra next üret
    setTimeout(() => {
      if (!state.levelSuccess && !state.gameOver && !state.nextBall) this._generateNextBall();
    }, 250);
  }

  // Pick + bırak: sürüklenip bırakılan pozisyondan serbest düşüş
  _dropBallAtPos(x, y) {
    if (!state.heldBall) return;
    const { CX, CY, MAIN_R } = state;
    const hb = state.heldBall;
    const dropX = Math.max(CX - MAIN_R + hb.r + 2, Math.min(CX + MAIN_R - hb.r - 2, x));
    const dropY = Math.max(CY - MAIN_R + hb.r + 2, y);
    const ball = this._makeBallObj(hb.level, dropX, dropY);
    ball.vy = 2;
    state.circles.push(ball);
    this._checkSpawnCollision(ball);
    state._lastDropX = dropX;
    this.audio.spawn();
    state.heldBall = null;
    // Kısa gecikme: düşen top spawn bölgesini geçsin, sonra next üret
    setTimeout(() => {
      if (!state.levelSuccess && !state.gameOver && !state.nextBall) this._generateNextBall();
    }, 250);
  }

  // ── Absorb / Merge ────────────────────────────────────────────────
  _triggerCombo(x, y) {
    if (state.currentLevel < TUTORIAL_LEVELS) return;
    if (state.lastComboFrame === state.frameCount) return;
    state.lastComboFrame = state.frameCount;
    state.combo++;
    state.comboTimer = Date.now() + 2000;
    const multiplier = Math.min(state.combo, 9);
    state.mainBorderFlash = 35;
    if (state.combo >= 2) {
      state.comboDisplays.push({ alpha: 1.0, scale: 1.4, x, y, text: `COMBO x${multiplier}` });
      // Her combo'da rate artar: 1.0 → 1.1 → 1.2 ... max 2.0
      state._comboRate = Math.min(2.0, 1.0 + (state.combo - 1) * 0.12);
      this.audio.combo(state.combo, state._comboRate);
    }
  }

  _celebrate(x, y, color) {
    const { S } = state;
    const count = 10; // mobil için azaltıldı
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (3 + Math.random() * 7) * S;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5 * S, r: (5 + Math.random() * 9) * S, color, life: 55 + Math.random() * 30, maxLife: 85 });
    }
  }

  // Bırakılan top için en yakın hedefi bul: absorb veya merge, hangisi daha yakınsa
  _tryInteract(draggedCircle) {
    const { circles } = state;
    let bestAbsorbTarget = null, bestAbsorbDist = Infinity;
    let bestMergeTarget  = null, bestMergeDist  = Infinity;

    for (const other of circles) {
      if (other === draggedCircle) continue;
      const d = Math.hypot(draggedCircle.x - other.x, draggedCircle.y - other.y);
      const threshold = (draggedCircle.r + other.r) * 1.1;
      if (d > threshold) continue;

      // Absorb adayı
      if (this.physics.canAbsorb(draggedCircle, other) || this.physics.canAbsorb(other, draggedCircle)) {
        if (d < bestAbsorbDist) { bestAbsorbDist = d; bestAbsorbTarget = other; }
      }
      // Merge adayı
      else if (other.level === draggedCircle.level && other.contains.length === 0 && draggedCircle.contains.length === 0) {
        if (d < bestMergeDist) { bestMergeDist = d; bestMergeTarget = other; }
      }
    }

    // İkisi de varsa en yakını seç
    if (bestAbsorbTarget && bestMergeTarget) {
      if (bestAbsorbDist <= bestMergeDist) return this._tryAbsorb(draggedCircle);
      else return this._tryMerge(draggedCircle);
    }
    if (bestAbsorbTarget) return this._tryAbsorb(draggedCircle);
    if (bestMergeTarget)  return this._tryMerge(draggedCircle);
    return false;
  }

  // Sürüklenen top bırakılınca absorb kontrolü
  _tryAbsorb(draggedCircle) {
    const { circles, LEVELS, S, currentLevel } = state;
    for (let i = 0; i < circles.length; i++) {
      const other = circles[i];
      if (other === draggedCircle) continue;
      const big   = this.physics.canAbsorb(draggedCircle, other) ? draggedCircle : (this.physics.canAbsorb(other, draggedCircle) ? other : null);
      const small = big === draggedCircle ? other : (big === other ? draggedCircle : null);
      if (!big || !small) continue;
      const { ov } = this.physics._overlap(big, small);
      if (ov > 0) {
        const allLevels = new Set([...big.contains, small.level, ...small.contains]);
        big.contains = [...allLevels].sort((a, b) => b - a);
        big.absorbAnim = 35; big.boing = 1.2; state.mainBorderFlash = 40;
        this.audio.absorb(big.level);
        if (currentLevel < TUTORIAL_LEVELS) state.actionTexts.push({ alpha: 1.0, x: big.x, y: big.y - big.r - 10 * S, text: 'Absorbed', color: LEVELS[small.level].color });
        state.chainWaves.push({ x: small.x, y: small.y, r: small.r * 0.4, maxR: small.r * 2.2, color: LEVELS[small.level].color, t: 0, maxT: 18 });
        state.chainWaves.push({ x: big.x, y: big.y, r: big.r * 0.3, maxR: big.r * 2.5, color: LEVELS[big.level].color, t: 0, maxT: 22 });
        this._celebrate(big.x, big.y, LEVELS[small.level].color);
        state.absorbingInto.push({ x: small.x, y: small.y, tx: big.x, ty: big.y, r: small.r, color: small.color, bigColor: big.color, t: 0, maxT: 22 });
        state.circles = state.circles.filter(cc => cc !== small);
        if (this.goals.checkGoal(big)) { const _id = big.id; setTimeout(() => { state.circles = state.circles.filter(c => c.id !== _id); }, 80); }
        return true;
      }
    }
    return false;
  }

  _checkAbsorption() {
    // Otomatik merge/absorb kaldırıldı — sadece drag bırakınca tetiklenir
  }

  // Drag bırakılınca merge kontrolü — aynı level, dokunma mesafesinde
  _tryMerge(draggedCircle) {
    const { circles, LEVELS, S, currentLevel } = state;
    const lv = draggedCircle.level;
    if (draggedCircle.contains.length > 0) return false;
    const same = circles.filter(c => c !== draggedCircle && c.level === lv && c.contains.length === 0);
    // En yakın aynı level topu bul
    let closest = null, closestDist = Infinity;
    for (const other of same) {
      const d = Math.hypot(draggedCircle.x - other.x, draggedCircle.y - other.y);
      if (d < closestDist) { closestDist = d; closest = other; }
    }
    if (!closest) return false;
    // Dokunma mesafesi: iki topun yarıçapları toplamının 1.1x'i
    const touchDist = (draggedCircle.r + closest.r) * 1.1;
    if (closestDist > touchDist) return false;
    const nL = lv + 1;
    if (nL >= LEVELS.length) return false;
    const mx = (draggedCircle.x + closest.x) / 2, my = (draggedCircle.y + closest.y) / 2;
    const newC = { id: Math.random(), x: mx, y: my, r: LEVELS[nL].r, level: nL, color: LEVELS[nL].color, vx: 0, vy: -2 * S, isBeingDragged: false, contains: [], absorbAnim: 30, boing: 1.0, absorbGlow: 0, spawnTime: Date.now() };
    state.circles = state.circles.filter(c => c !== draggedCircle && c !== closest);
    state.circles.push(newC);
    this.audio.merge(nL);
    if (currentLevel < TUTORIAL_LEVELS) state.actionTexts.push({ alpha: 1.0, x: mx, y: my - LEVELS[nL].r - 10 * S, text: 'Merged', color: LEVELS[nL].color });
    this._triggerCombo(mx, my);
    state.mainBorderFlash = 40;
    state.chainWaves.push({ x: mx, y: my, r: LEVELS[nL].r * 0.5, maxR: LEVELS[nL].r * 2.8, color: LEVELS[nL].color, t: 0, maxT: 22 });
    // Komşu chain kontrolü
    const neighbors = state.circles.filter(c => c.id !== newC.id && c.level === nL && c.contains.length === 0 && Math.hypot(c.x - mx, c.y - my) < (newC.r + c.r) * 1.4);
    if (neighbors.length > 0 && nL < LEVELS.length - 1) {
      state.chainWaves.push({ x: mx, y: my, r: LEVELS[nL].r, maxR: LEVELS[nL].r * 4.5, color: '#fff', t: 0, maxT: 28 });
      this._celebrate(mx, my, LEVELS[nL].color);
    }
    if (this.goals.checkGoal(newC)) { const _id = newC.id; setTimeout(() => { state.circles = state.circles.filter(c => c.id !== _id); }, 80); }
    return true;
  }


  // Yeni top yerleşebilir mi? Etrafında hiç boşluk yoksa game over
  _checkNewBallStuck(ball) {
    const { circles } = state;
    let blockedCount = 0;
    for (const c of circles) {
      if (c === ball) continue;
      const dist = Math.hypot(ball.x - c.x, ball.y - c.y);
      const minD  = ball.r + c.r;
      if (dist < minD * 0.8) {
        // Merge veya absorb olabiliyorsa sorun değil
        if (this.physics.canAbsorb(c, ball) || this.physics.canAbsorb(ball, c)) continue;
        if (ball.level === c.level && ball.contains.length === 0 && c.contains.length === 0) continue;
        blockedCount++;
      }
    }
    // Manuel mekanik: oyuncu topları hareket ettirebilir, erken game over yok
    // blockedCount kontrolü kaldırıldı
  }

  // ── Update loop ───────────────────────────────────────────────────
  _update() {
    this._computeCapParams(); // physics öncesi capParams güncelle
    if (state.isPaused) {
      if (state.autoDropDeadline > 0) state.autoDropDeadline = Date.now() + 1000;
      return;
    }
    if (state.levelSuccess) {
      this.goals.updateFlyingGoals(this.audio);
      // Animasyon sayaçları devam etsin ama fizik dursun
      state.rotVel = 0;
      for (const c of state.circles) { c.vx = 0; c.vy = 0; }
      return;
    }
    if (state.gameOver) {
      state.gameOverAlpha = Math.min(1, state.gameOverAlpha + 0.06);
      state.rotVel = 0;
      for (const c of state.circles) {
        c.vx = 0; c.vy = 0;
        if (!c.isBeingDragged) this.physics._clampToU(c);
      }
      return;
    }

    const now = Date.now();
    const { S, CX, CY, MAIN_R } = state;

    if (state.mainBorderFlash > 0) state.mainBorderFlash--;

    // Otomatik düşme — oyuncu 4s içinde almazsa top kendisi düşer
    if (state.nextBall && !state.levelSuccess && !state.gameOver &&
        state.autoDropDeadline > 0 && now >= state.autoDropDeadline) {
      const nb = state.nextBall;
      state.nextBall = null;
      state._nextBallBlocked = false;
      state.autoDropDeadline = 0;
      const autoY = CY - MAIN_R + nb.r + 4;
      const ball = this._makeBallObj(nb.level, nb.x, autoY);
      ball.vy = 2;
      state.circles.push(ball);
      this.audio.spawn();
      setTimeout(() => {
        if (!state.levelSuccess && !state.gameOver && !state.nextBall) this._generateNextBall();
      }, 250);
    }

    // Hedef animasyonları
    this.goals.updateFlyingGoals(this.audio);

    // Dünya rotasyonu
    if (!state.isDraggingWorld && Math.abs(state.rotVel) > 0.0001) {
      this.physics.applyWorldRotation();
    }



    // Fizik
    this.physics.updateCirclePhysics();
    this.physics.updateAbsorbGlow();

    // Animasyon sayaçları
    state.frameCount++;
    state.gameTime += 16.67;
    if (state.comboTimer > 0 && now > state.comboTimer) { state.comboTimer = 0; state.combo = 0; }
    for (let i = state.comboDisplays.length - 1; i >= 0; i--) { const cd = state.comboDisplays[i]; cd.alpha -= 0.022; cd.scale = Math.max(1.0, cd.scale - 0.025); cd.y -= 0.8 * S; if (cd.alpha <= 0) state.comboDisplays.splice(i, 1); }
    for (let i = state.actionTexts.length - 1; i >= 0; i--) { const at = state.actionTexts[i]; at.alpha -= 0.022; at.y -= 0.7 * S; if (at.alpha <= 0) state.actionTexts.splice(i, 1); }
    for (let i = state.chainWaves.length - 1; i >= 0; i--) { const w = state.chainWaves[i]; w.t++; w.r += (w.maxR - w.r) * 0.18; if (w.t >= w.maxT) state.chainWaves.splice(i, 1); }
    for (let i = state.absorbingInto.length - 1; i >= 0; i--) { const a = state.absorbingInto[i]; a.t++; if (a.t >= a.maxT) state.absorbingInto.splice(i, 1); }

    // Tutorial güncelle
    this.tutorial.update();
    if (state.currentLevel >= TUTORIAL_LEVELS && state.frameCount % 3 === 0) {
      this.hints.update(this.physics.canAbsorb.bind(this.physics));
    }

    // Particle sayısı sınırı — mobilde 150 üzeri ciddi yavaşlama
    if (state.particles.length > 80) state.particles.length = 80;

    // Drag tam overlay — otomatik tetikle
    if (state.draggedCircle) {
      const dc = state.draggedCircle;
      for (const other of state.circles) {
        if (other === dc) continue;
        const d = Math.hypot(dc.x - other.x, dc.y - other.y);
        const triggerDist = (dc.r + other.r) * 0.25;
        if (d < triggerDist) {
          const canAbs = this.physics.canAbsorb(dc, other) || this.physics.canAbsorb(other, dc);
          const canMerge = dc.level === other.level && dc.contains.length === 0 && other.contains.length === 0;
          if (canAbs || canMerge) {
            dc.isBeingDragged = false;
            dc.vx = 0; dc.vy = 0;
            dc.absorbNear = false;
            state._dragLockedTarget = null;
            state.draggedCircle = null;
            this._tryInteract(dc);
            break;
          }
        }
      }
    }

    // Çarpışmalar + blast + absorb/merge
    this.physics.solveCollisions();
    this.blast.update();

    if (!state.gameOver) {
      this._checkAbsorption();

      // Game over: Her 30 framede bir alan kontrolü — doluluk %88+
      const now2 = Date.now();
      // game over: spawn noktasında top varsa direkt tetikleniyor (_dropBall* içinde)
    }

    // Her frame: tüm toplar U içinde garantili
    for (const c of state.circles) this.physics._clampToU(c);


  }

  // ── Draw loop ─────────────────────────────────────────────────────
  _draw() {
    const R = this.renderer;
    const { ctx, W, H, CX, CY, MAIN_R, S, circles, LEVELS } = state;

    // ── Arka plan — dark/light mode ──────────────────────────────────
    const th = state.theme;
    const isDark = state.isDarkMode;
    {
      const bg = isDark
        ? ctx.createRadialGradient(CX, H * 0.42, 0, CX, H * 0.5, Math.max(W, H) * 0.75)
        : ctx.createRadialGradient(CX, H * 0.42, 0, CX, H * 0.5, Math.max(W, H) * 0.75);
      if (isDark) {
        // Derin lacivert → mor — "C" seçeneği
        bg.addColorStop(0,   '#1E1545');
        bg.addColorStop(0.45,'#150F35');
        bg.addColorStop(0.80,'#0F0A28');
        bg.addColorStop(1,   '#080518');
      } else {
        // Canlı gökyüzü mavisi — hypercasual
        bg.addColorStop(0,   '#E8F9FF');
        bg.addColorStop(0.40,'#C2EEFF');
        bg.addColorStop(0.75,'#96D8F8');
        bg.addColorStop(1,   '#68C0EE');
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    // Arena rengi — 3 framede bir güncelle (görsel fark yok)
    if (state.frameCount % 3 === 0 || !this._cachedArenaColor) {
      let topLevel = 0;
      for (const cc of circles) {
        if (cc.level > topLevel) topLevel = cc.level;
        for (const lv of cc.contains) if (lv > topLevel) topLevel = lv;
      }
      const _nb = state.nextBall, _hb = state.heldBall;
      this._cachedArenaColor = circles.length > 0
        ? LEVELS[topLevel].color
        : (_nb ? (LEVELS[_nb.level]?.color || LEVELS[0].color)
          : (_hb ? (LEVELS[_hb.level]?.color || LEVELS[0].color)
            : LEVELS[0].color));
    }
    const arenaColor = this._cachedArenaColor;

    // Arena — capParams'tan oku (her frame _update başında hesaplandı)
    const mFlash = state.mainBorderFlash > 0 ? state.mainBorderFlash / 40 : 0;
    const mBlur  = mFlash > 0 ? 7 + mFlash * 22 : 6;
    {
      const { arcStart, arcEnd, lx1, ly1, lx2, ly2, tx1, tx2, topY } = state.capParams;
      const rDX = tx1-lx1, rDY = topY-ly1, rLen = Math.sqrt(rDX*rDX+rDY*rDY);
      const rNx = rDX/rLen, rNy = rDY/rLen;
      const lDX = tx2-lx2, lDY = topY-ly2, lLen = Math.sqrt(lDX*lDX+lDY*lDY);
      const lNx = lDX/lLen, lNy = lDY/lLen;
      const cr = Math.min(rLen * 0.10, 16 * S);

      const _path = () => {
        ctx.beginPath();
        ctx.arc(CX, CY, MAIN_R, arcStart, arcEnd + Math.PI * 2);
        ctx.lineTo(lx2 + lNx*(lLen-cr), ly2 + lNy*(lLen-cr));
        ctx.quadraticCurveTo(tx2, topY, tx2+cr, topY);
        ctx.lineTo(tx1-cr, topY);
        ctx.quadraticCurveTo(tx1, topY, tx1-rNx*cr, topY-rNy*cr);
        ctx.lineTo(lx1, ly1);
      };

      ctx.save(); _path(); ctx.closePath();
      ctx.fillStyle = state.isDarkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.07)';
      ctx.fill(); ctx.restore();

      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = arenaColor; ctx.shadowBlur = mBlur;
      ctx.strokeStyle = arenaColor; ctx.lineWidth = Math.round(4 * S); ctx.globalAlpha = 1;
      _path(); ctx.stroke();
      if (mFlash > 0) { ctx.shadowBlur = mBlur * 1.5; _path(); ctx.stroke(); }

      const dashLen = 9 * S, gapLen = 6 * S;
      ctx.setLineDash([dashLen, gapLen]);
      ctx.beginPath(); ctx.moveTo(tx2+cr, topY); ctx.lineTo(tx1-cr, topY);
      ctx.strokeStyle = arenaColor; ctx.lineWidth = Math.round(2.5 * S);
      ctx.globalAlpha = 0.55; ctx.shadowColor = arenaColor; ctx.shadowBlur = 5 * S;
      ctx.stroke();
      ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      ctx.restore();
    }

    // nextBall göstergesi — orta üst
    if (state.nextBall) {
      const nb = state.nextBall;
      ctx.save();

      // Timer arc — kaç saniye kaldı
      if (state.autoDropDeadline > 0) {
        const remaining = Math.max(0, state.autoDropDeadline - Date.now());
        const progress = remaining / 1000; // 1→0
        const arcR = nb.r + 8 * S;
        // bgColor parlaklığı: koyu bg → beyaz arc, açık bg → koyu arc
        const isDarkBg = state.isDarkMode;
        const trackColor = isDarkBg ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
        const baseColor  = isDarkBg ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)';
        // Arka arc (track)
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, arcR, -Math.PI/2, -Math.PI/2 + Math.PI*2);
        ctx.strokeStyle = trackColor;
        ctx.lineWidth = 2.5 * S; ctx.stroke();
        // Kalan süre arc
        const urgency = progress < 0.3;
        const arcColor = urgency ? 'rgba(255,68,68,0.75)' : baseColor;
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, arcR, -Math.PI/2, -Math.PI/2 + Math.PI*2*progress);
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = 2.5 * S;
        ctx.stroke();
      }

      // Blocked halo — nextBall uyarısı
      if (state._nextBallBlocked) {
        const pulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 130));
        ctx.save();
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, nb.r + 4 * S, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(220,40,40,${pulse})`;
        ctx.lineWidth = 5 * S;
        ctx.shadowColor = 'rgba(220,40,40,0.9)';
        ctx.shadowBlur = (20 + pulse * 20) * S;
        ctx.globalAlpha = pulse;
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      R.drawSphere({ ...nb, color: state.LEVELS[nb.level]?.color || '#fff', boing:0, absorbAnim:0, squish:null, absorbGlow:0, isBeingDragged:false, contains:[] });
      ctx.restore();
    }



    // heldBall — sürüklenen top
    if (state.heldBall) {
      const hb = state.heldBall;
      ctx.save();
      ctx.globalAlpha = 0.92;
      R.drawSphere({ ...hb, color: state.LEVELS[hb.level]?.color || '#fff',
        boing:0, absorbAnim:0, squish:null, absorbGlow:0,
        isBeingDragged:true, contains:[], shape: state.LEVELS[hb.level]?.shape || 'sphere' });
      ctx.restore();
    }

    // Parçacıklar
    R.drawParticles();

    // Chain dalgaları
    R.drawChainWaves();

    // Hedefler
    R.drawGoals(this.goals);

    // Toplar — y'ye göre sırala: her 3 framede bir güncelle
    if (state.frameCount % 3 === 0 || !state._sortedCircles || state._sortedCircles.length !== circles.length) {
      state._sortedCircles = circles.slice().sort((a, b) => a.y - b.y);
    }
    for (const c of state._sortedCircles) R.drawSphere(c);

    // Blocked halo — üst üste binen mevcut toplar
    if (state._nextBallBlocked && state.nextBall) {
      const nb = state.nextBall;
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 130));
      for (const c of circles) {
        if (this._significantOverlap(nb.x, nb.y, nb.r, c)) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r + 4 * S, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220,40,40,${pulse})`;
          ctx.lineWidth = 5 * S;
          ctx.shadowColor = 'rgba(220,40,40,0.9)';
          ctx.shadowBlur = (20 + pulse * 20) * S;
          ctx.globalAlpha = pulse;
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Absorb animasyonu
    R.drawAbsorbAnims();

    // Tutorial hint
    if (state.isTutorial && !state.tutDone) {
      this.tutorial.drawHint();
    }
    // Hint zincirleri — her levelda göster
    this.hints.drawAllChains(this.goals);

    // Action + combo metinleri
    R.drawActionTexts();
    R.drawComboDisplays();

    // Blast (overlay'den önce — arkada kalır)
    const bRect = this.blast.getBtnRect();
    if (bRect) R.drawBlastBtn(bRect, !state.levelSuccess && !state.gameOver && this.blast.isEnabled(bRect));
    R.drawBlastProjectiles();

    // Palette guide + settings butonları — overlay'lardan önce, arkada kalır
    R.drawPaletteGuide();
    const _overlayActive = state.levelSuccess || state.gameOver || state.tutShowPopup || state.isPaused;
    if (_overlayActive) { state.ctx.save(); state.ctx.globalAlpha = 0.30; }
    R.drawBtnPanel();
    R.drawSoundBtn();
    R.drawDarkModeBtn();
    R.drawTutorialBtn();
    R.drawHomeBtn();
    R.drawPauseBtn();
    if (_overlayActive) state.ctx.restore();

    // Success / Game over / Tutorial overlay'leri — butonların üstüne çizilir
    R.drawSuccessOverlay(this.goals, this.tutorial);
    if (state.gameOver) R.drawGameOver(this.goals);
    if (state.tutShowPopup) {
      this.tutorial.drawPopup();
    }
    if (state.isPaused) {
      R.drawPauseOverlay();
    } else {
      state._resumeBtn = null;
    }
  }

  // ── capParams — her frame physics öncesi hesaplanır ──────────────
  _computeCapParams() {
    const { CX, CY, MAIN_R, W, containerForm } = state;
    const form         = containerForm || {};
    const openAngle    = Math.PI * (form.openFrac  ?? 0.50);
    const twf          = form.topWidthFactor ?? 1.00;
    const arcStart     = -Math.PI / 2 + openAngle;
    const arcEnd       = -Math.PI / 2 - openAngle;
    const lx1 = CX + Math.cos(arcStart) * MAIN_R;
    const ly1 = CY + Math.sin(arcStart) * MAIN_R;
    const lx2 = CX + Math.cos(arcEnd)   * MAIN_R;
    const ly2 = CY + Math.sin(arcEnd)   * MAIN_R;
    const juncHW = Math.abs(lx1 - CX);
    const juncY  = ly1;
    const topY   = CY - MAIN_R;
    const wallH  = Math.max(1, juncY - topY);
    const maxHW  = W / 2 - 8;
    const topHW  = Math.min(juncHW * twf, maxHW);
    const effTWF = topHW / Math.max(juncHW, 0.001);
    state.capParams = {
      arcStart, arcEnd, lx1, ly1, lx2, ly2,
      juncHW, juncY, topY, topHW, wallH, effTWF,
      tx1: CX + topHW, tx2: CX - topHW,
    };
  }

  // Kap formu sınırı içine clamp — physics _wallHW ile aynı formül
  _clampToCapBounds(px, py, r) {
    const { CX, CY, MAIN_R } = state;
    const cp = state.capParams;
    if (!cp) return { x: px, y: py };
    const { juncHW, juncY, topY, wallH, effTWF } = cp;
    let ox = px, oy = py;
    if (oy >= juncY) {
      const dx = ox - CX, dy = oy - CY, d = Math.hypot(dx, dy) || 0.01;
      const maxD = MAIN_R - r;
      if (d > maxD) { ox = CX + dx/d*maxD; oy = CY + dy/d*maxD; }
    } else {
      const t  = Math.max(0, Math.min(1, (juncY - oy) / wallH));
      const hw = Math.max(r, juncHW * (1 + (effTWF - 1) * t) - r);
      if (ox < CX - hw) ox = CX - hw;
      if (ox > CX + hw) ox = CX + hw;
      if (oy < topY + r) oy = topY + r;
    }
    return { x: ox, y: oy };
  }

  // ── Ana döngü ─────────────────────────────────────────────────────
  // id parametresi: çift loop oluşmasını engeller. Sadece son startFromLevel/
  // startFromCheckpoint çağrısının verdiği ID ile gelen loop devam eder.
  _loop(id) {
    if (id !== undefined && id !== this._loopId) return; // eski loop — sessizce öl
    try {
      this._update();
      this._draw();
    } catch (e) {
      const { ctx, W, H } = state;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#FF1744'; ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const msg = (e && e.stack ? e.stack : String(e)).slice(0, 800);
      const lines = msg.match(/.{1,55}/g) || [msg];
      lines.forEach((l, i) => ctx.fillText(l, 10, 10 + i * 20));
      ctx.restore();
      console.error(e);
      return; // döngüyü durdur, hata ekranda görünür
    }
    requestAnimationFrame(() => this._loop(id));
  }
}
