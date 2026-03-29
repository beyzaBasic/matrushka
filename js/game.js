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
  }

  // ── Dünya paleti ─────────────────────────────────────────────────
  // Tema yönetimi ThemeManager'a devredildi — _applyWorldPalette kaldırıldı

  // ── Layout ────────────────────────────────────────────────────────
  _applyLayout() {
    const L = buildLayout();
    Object.assign(state, L);
    this.theme?.reapplyAfterResize();
    // canvas boyutlandır
    const { canvas, ctx } = state;
    canvas.width  = Math.round(L.CSS_W * L.DPR);
    canvas.height = Math.round(L.CSS_H * L.DPR);
    canvas.style.width  = L.CSS_W + 'px';
    canvas.style.height = L.CSS_H + 'px';
    ctx.setTransform(L.DPR, 0, 0, L.DPR, 0, 0);
    // mousePos varsayılanı
    state.mousePos     = { x: L.CX, y: L.CY };
    state.prevMousePos = { x: L.CX, y: L.CY };
  }

  // ── Input ─────────────────────────────────────────────────────────
  _setupInput() {
    const { canvas } = state;
    canvas.addEventListener('mousedown',  e => this._onDown(e));
    canvas.addEventListener('mousemove',  e => this._onMove(e));
    canvas.addEventListener('mouseup',    e => this._onUp(e));
    canvas.addEventListener('touchstart', e => this._onDown(e), { passive: false });
    canvas.addEventListener('touchmove',  e => this._onMove(e), { passive: false });
    canvas.addEventListener('touchend',   e => this._onUp(e));
  }

  _getPos(e) {
    const rect = state.canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _onDown(e) {
    e.preventDefault();
    const { x, y } = this._getPos(e);
    state.mousePos = { x, y };
    this.audio.unlock();

    if (state.gameOver) {
      const gb = state._gameOverBtn;
      if (gb && x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) this._restartCurrentLevel();
      return;
    }

    const pb = state._pauseBtn;
    if (pb && x >= pb.x && x <= pb.x + pb.w && y >= pb.y && y <= pb.y + pb.h) {
      state.isPaused = !state.isPaused;
      return;
    }
    const rb = state._resumeBtn;
    if (rb && x >= rb.x && x <= rb.x + rb.w && y >= rb.y && y <= rb.y + rb.h) {
      state.isPaused = false; return;
    }
    if (state.isPaused) return;

    state.mainBorderFlash = 30;

    const nlb = state._nextLevelBtn;
    if (nlb && nlb.a > 0.5 && x >= nlb.x && x <= nlb.x + nlb.w && y >= nlb.y && y <= nlb.y + nlb.h) {
      this._nextLevel(); return;
    }

    // Blast butonu
    const bRect = this.blast.getBtnRect();
    if (bRect && x >= bRect.x && x <= bRect.x + bRect.w && y >= bRect.y && y <= bRect.y + bRect.h * 1.2) {
      if (this.blast.isEnabled(bRect)) this.blast.fire(bRect, this.audio);
      return;
    }

    const { CX, CY, MAIN_R, S } = state;

    // heldBall sürükleniyorsa bırak
    if (state.heldBall) {
      this._dropBall(x, y);
      return;
    }

    // nextBall'a dokunuldu mu? → sürüklemeye başla
    if (this._pickUpBall(x, y)) return;

    // Önce mevcut toplara dokunuluyor mu kontrol et
    const found = state.circles.slice().reverse().find(c => Math.hypot(x - c.x, y - c.y) < Math.max(c.r * 1.5, 44 * S));
    if (found) {
      // Mevcut topa dokunuldu — sürükle, top düşürme
      state.draggedCircle = found;
      state.draggedCircle.isBeingDragged = true;
      this.audio.pick();
      return;
    }

    // Boşluğa tıklandı → top o noktadan düşsün
    if (state.nextBall) {
      const distFromCenter = Math.hypot(x - CX, y - CY);
      if (distFromCenter < MAIN_R * 1.15) {
        const nb = state.nextBall;
        state.nextBall = null;
        // X sınırı
        let dropX = Math.max(CX - MAIN_R + nb.r + 2, Math.min(CX + MAIN_R - nb.r - 2, x));
        // Y: U kenarından başla
        let dropY = CY - MAIN_R + nb.r + 4;
        // Daire sınırı — drop noktası daire içinde olmalı
        const dDrop = Math.hypot(dropX - CX, dropY - CY);
        if (dDrop + nb.r > MAIN_R - 2) {
          // Daire içine çek
          const a = Math.atan2(dropY - CY, dropX - CX);
          dropX = CX + Math.cos(a) * (MAIN_R - nb.r - 2);
          dropY = CY + Math.sin(a) * (MAIN_R - nb.r - 2);
        }
        const ball = this._makeBallObj(nb.level, dropX, dropY);
        ball.vy = 2;
        state.circles.push(ball);
        this.audio.spawn();
        setTimeout(() => {
          if (!state.levelSuccess && !state.gameOver) this._generateNextBall();
        }, 500);
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
    // heldBall parmakla takip etsin — U sınırları içinde
    if (state.heldBall) {
      const { CX, CY, MAIN_R, SCORE_AREA } = state;
      const hb = state.heldBall;
      // Sol/sağ duvar sınırı
      const clampedX = Math.max(CX - MAIN_R + hb.r, Math.min(CX + MAIN_R - hb.r, x));
      // Üst sınır: score alanının altı, Alt sınır: serbest (U içinde)
      const clampedY = Math.max(SCORE_AREA + hb.r + 4, y);
      hb.x = clampedX;
      hb.y = clampedY;
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
    // heldBall bırakıldı — arena'ya ekle
    if (state.heldBall) {
      this._dropBall(state.mousePos.x, state.mousePos.y);
      return;
    }
    if (state.draggedCircle) {
      state.draggedCircle.isBeingDragged = false;
      const maxThrow = 18 * state.S;
      state.draggedCircle.vx = Math.max(-maxThrow, Math.min(maxThrow, state.mouseVel.x * 0.85));
      state.draggedCircle.vy = Math.max(-maxThrow, Math.min(maxThrow, state.mouseVel.y * 0.85));
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
    this._startFromLevel(internalLevel);
    requestAnimationFrame(() => this._loop());
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
    state.circles           = [];
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
    state.tut0Step          = -1;  // _preloadArena set eder
    state.tut0Transitioning = false;
    state._tut1done         = false;
    state._nextLevelBtn     = null;
    state._gameOverBtn      = null;
    this.theme.applyForLevel(internalLevel);
    this.goals.initLevelGoals();
    this._preloadArena();
    // İlk topu üret
    state.nextBall = null; state.heldBall = null;
    setTimeout(() => {
      if (!state.levelSuccess && !state.gameOver) this._generateNextBall();
    }, 600);
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
    state.tut0Step         = -1;
    state.tut0Transitioning = false;
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
    this.theme.applyForLevel(nextLevel);
    this.goals.initLevelGoals();
    this._preloadArena();
    // İlk topu üret (tutorial değilse)
    state.nextBall = null; state.heldBall = null;
    if (state.currentLevel >= TUTORIAL_LEVELS) {
      setTimeout(() => this._generateNextBall(), 600);
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
    const { CX, CY, MAIN_R } = state;
    state.circles = []; state.introDropsDone = false;
    if (state.currentLevel === 0) {
      state.tut0Step = 0;
      this.tutorial.spawnStep();
      return;
    }
    if (state.currentLevel === 1) {
      this._dropSequential(
        [{ lv: 0, xOff: -MAIN_R * 0.20 }, { lv: 1, xOff: MAIN_R * 0.20 }],
        () => { state.introDropsDone = true; state.lastSpawn = Date.now(); }
      );
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
    const roll = Math.random();
    if (this._countLevel0() >= 10) return roll < 0.70 ? 1 : 2;
    const { lo, mid, hi } = this.goals.getSpawnLevels();
    return roll < 0.50 ? lo : roll < 0.85 ? mid : hi;
  }

  _makeBallObj(lv, x, y) {
    const { LEVELS } = state;
    return {
      id: Math.random(), x, y,
      r: LEVELS[lv].r, level: lv,
      color: LEVELS[lv].color,
      vx: 0, vy: LEVELS[lv].vy,
      contains: [], absorbAnim: 0,
      isBeingDragged: false, boing: 0, absorbGlow: 0
    };
  }

  // U'nun üst kenarı hizasında bekleyen top
  _generateNextBall() {
    const lv = this._randomBallLevel();
    const { CX, CY, MAIN_R, LEVELS } = state;
    const r = LEVELS[lv].r;
    const nx = CX;                // yatayda tam orta
    const ny = CY - MAIN_R + r;  // topun tepesi U üst kenarında
    state.nextBall = { level: lv, r, color: LEVELS[lv].color, x: nx, y: ny };
    state.autoDropDeadline = Date.now() + 4000; // 4s otomatik düşme
  }

  // Oyuncu topu aldı — heldBall oluştur
  _pickUpBall(touchX, touchY) {
    if (!state.nextBall || state.heldBall || state.levelSuccess || state.gameOver) return false;
    const nb = state.nextBall;
    const dist = Math.hypot(touchX - nb.x, touchY - nb.y);
    if (dist > nb.r * 1.8) return false; // Sadece top üzerine gelince al
    state.heldBall = { ...nb, x: touchX, y: touchY };
    state.nextBall = null;
    state.autoDropDeadline = 0; // oyuncu aldı, timer dur
    this.audio.pick();
    return true;
  }

  // Oyuncu bıraktı — arena'ya ekle, 0.5s sonra yeni top üret
  _dropBall(x, y) {
    if (!state.heldBall) return;
    const { CX, CY, MAIN_R } = state;
    const hb = state.heldBall;
    // Arena sınırları içine kısıtla
    const dx = x - CX, dy = y - CY;
    const dist = Math.hypot(dx, dy);
    const maxD = MAIN_R - hb.r - 2;
    let dropX = x, dropY = y;
    if (dist > maxD) {
      const a = Math.atan2(dy, dx);
      dropX = CX + Math.cos(a) * maxD;
      dropY = CY + Math.sin(a) * maxD;
    }
    // Sol/sağ duvar sınırı
    dropX = Math.max(CX - MAIN_R + hb.r + 2, Math.min(CX + MAIN_R - hb.r - 2, dropX));
    // Üst sınır — U kenarının içinde
    dropY = Math.max(CY - MAIN_R + hb.r + 4, dropY);
    // Yalnızca arena içindeyse bırak
    if (Math.hypot(dropX - CX, dropY - CY) < MAIN_R + hb.r) {
      const ball = this._makeBallObj(hb.level, dropX, dropY);
      state.circles.push(ball);
      this.audio.spawn();
    }
    state.heldBall = null;
    // 0.5s sonra yeni top üret
    setTimeout(() => {
      if (!state.levelSuccess && !state.gameOver) {
        this._generateNextBall(); // _generateNextBall içinde timer başlar
      }
    }, 500);
  }

  // ── Absorb / Merge ────────────────────────────────────────────────
  _triggerCombo(x, y) {
    if (state.currentLevel < TUTORIAL_LEVELS) return;
    if (state.lastComboFrame === state.frameCount) return;
    state.lastComboFrame = state.frameCount;
    state.combo++;
    state.comboTimer = Date.now() + 3000;
    const multiplier = Math.min(state.combo, 9);
    state.mainBorderFlash = 35;
    if (state.combo >= 2) {
      state.comboDisplays.push({ alpha: 1.0, scale: 1.4, x, y, text: `COMBO x${multiplier}` });
      this.audio.combo(state.combo);
    }
  }

  _celebrate(x, y, color) {
    const { S } = state;
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (3 + Math.random() * 7) * S;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5 * S, r: (5 + Math.random() * 9) * S, color, life: 55 + Math.random() * 30, maxLife: 85 });
    }
  }

  _checkAbsorption() {
    const { circles, LEVELS, S, currentLevel } = state;

    // Absorb
    for (let i = 0; i < circles.length; i++) {
      for (let j = 0; j < circles.length; j++) {
        if (i === j) continue;
        const big = circles[i], small = circles[j];
        if (!this.physics.canAbsorb(big, small)) continue;
        if (Math.hypot(big.x - small.x, big.y - small.y) < big.r * 0.75) {
          const allLevels = new Set([...big.contains, small.level, ...small.contains]);
          big.contains = [...allLevels].sort((a, b) => b - a);
          big.absorbAnim = 35; big.boing = 1.2; state.mainBorderFlash = 40;
          this.audio.absorb(big.level);
          if (currentLevel < TUTORIAL_LEVELS) state.actionTexts.push({ alpha: 1.0, x: big.x, y: big.y - big.r - 10 * S, text: 'Absorbed', color: LEVELS[small.level].color });
          state.chainWaves.push({ x: small.x, y: small.y, r: small.r * 0.4, maxR: small.r * 2.2, color: LEVELS[small.level].color, t: 0, maxT: 18 });
          state.chainWaves.push({ x: big.x, y: big.y, r: big.r * 0.3, maxR: big.r * 2.5, color: LEVELS[big.level].color, t: 0, maxT: 22 });
          this._celebrate(big.x, big.y, LEVELS[small.level].color);
          state.absorbingInto.push({ x: small.x, y: small.y, tx: big.x, ty: big.y, r: small.r, color: small.color, bigColor: big.color, t: 0, maxT: 22 });
          state.circles = circles.filter(cc => cc !== small);
          if (this.goals.checkGoal(big)) { const _id = big.id; setTimeout(() => { state.circles = state.circles.filter(c => c.id !== _id); }, 80); }
          return;
        }
      }
    }

    // Merge
    for (let lv = 0; lv < LEVELS.length - 1; lv++) {
      const same = circles.filter(c => c.level === lv && c.contains.length === 0 && !c.isBeingDragged);
      if (same.length < 2) continue;
      for (let a = 0; a < same.length; a++) {
        for (let b = a + 1; b < same.length; b++) {
          const A = same[a], B = same[b];
          if (Math.hypot(A.x - B.x, A.y - B.y) < (A.r + B.r) * 1.15) {
            const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, nL = lv + 1;
            const newC = { id: Math.random(), x: mx, y: my, r: LEVELS[nL].r, level: nL, color: LEVELS[nL].color, vx: 0, vy: -2 * S, isBeingDragged: false, contains: [], absorbAnim: 30, boing: 1.0, absorbGlow: 0 };
            state.circles = circles.filter(c => c.id !== A.id && c.id !== B.id);
            state.circles.push(newC);
            
            this.audio.merge(nL);
            if (currentLevel < TUTORIAL_LEVELS) state.actionTexts.push({ alpha: 1.0, x: mx, y: my - LEVELS[nL].r - 10 * S, text: 'Merged', color: LEVELS[nL].color });
            this._triggerCombo(mx, my);
            state.mainBorderFlash = 40;
            state.chainWaves.push({ x: mx, y: my, r: LEVELS[nL].r * 0.5, maxR: LEVELS[nL].r * 2.8, color: LEVELS[nL].color, t: 0, maxT: 22 });
            const neighbors = state.circles.filter(c => c.id !== newC.id && c.level === nL && c.contains.length === 0 && Math.hypot(c.x - mx, c.y - my) < (newC.r + c.r) * 1.4);
            if (neighbors.length > 0 && nL < LEVELS.length - 1) {
              state.chainWaves.push({ x: mx, y: my, r: LEVELS[nL].r, maxR: LEVELS[nL].r * 4.5, color: '#fff', t: 0, maxT: 28 });
              this._celebrate(mx, my, LEVELS[nL].color);
            }
            if (this.goals.checkGoal(newC)) { const _id = newC.id; setTimeout(() => { state.circles = state.circles.filter(c => c.id !== _id); }, 80); }
            return;
          }
        }
      }
    }
  }

  // ── Update loop ───────────────────────────────────────────────────
  _update() {
    if (state.isPaused) return;
    if (state.levelSuccess) { this.goals.updateFlyingGoals(this.audio); return; }

    const now = Date.now();
    const { S, CX, CY, MAIN_R } = state;

    if (state.mainBorderFlash > 0) state.mainBorderFlash--;

    // Otomatik düşme — oyuncu 4s içinde almazsa top kendisi düşer
    if (state.nextBall && !state.heldBall && !state.levelSuccess && !state.gameOver &&
        state.autoDropDeadline > 0 && now >= state.autoDropDeadline) {
      const nb = state.nextBall;
      state.nextBall = null;
      state.autoDropDeadline = 0;
      const autoY = CY - MAIN_R + nb.r + 4;
      const ball = this._makeBallObj(nb.level, nb.x, autoY);
      ball.vy = 2;
      state.circles.push(ball);
      this.audio.spawn();
      setTimeout(() => {
        if (!state.levelSuccess && !state.gameOver) this._generateNextBall();
      }, 500);
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

    // Tutorial
    this.tutorial.update();
    if (state.currentLevel < TUTORIAL_LEVELS) this.hints.update(this.physics.canAbsorb.bind(this.physics));

    // Hints

    // Çarpışmalar + blast + absorb/merge
    this.physics.solveCollisions();
    this.blast.update();

    if (!state.gameOver) {
      this._checkAbsorption();
      const totalArea = state.circles.reduce((s, c) => s + Math.PI * c.r * c.r, 0);
      if (totalArea > Math.PI * MAIN_R * MAIN_R * 0.88) { state.gameOver = true; this.audio.gameOver(); }
      // U ağzından kaçan topları temizle
      state.circles = state.circles.filter(c => {
        const dy = c.y - CY, dx = c.x - CX;
        const dist = Math.hypot(dx, dy);
        // Üst bölgede ve arena dışındaysa kaldır
        return !(dy < -MAIN_R * 0.3 && dist > MAIN_R + c.r * 2);
      });
    }

    if (state.gameOver) state.gameOverAlpha = Math.min(1, state.gameOverAlpha + 0.06);
  }

  // ── Draw loop ─────────────────────────────────────────────────────
  _draw() {
    const R = this.renderer;
    const { ctx, W, H, CX, CY, MAIN_R, S, circles, LEVELS } = state;

    // Arka plan — theme'den
    const th = state.theme;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   th?.bgTop || '#0d0a1a');
    bg.addColorStop(0.5, th?.bgMid || '#0a0f1e');
    bg.addColorStop(1,   th?.bgBot || '#060810');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Arena rengi — sahnedeki en yüksek level, yoksa theme accent
    let topLevel = 0;
    for (const cc of circles) { if (cc.level > topLevel) topLevel = cc.level; for (const lv of cc.contains) if (lv > topLevel) topLevel = lv; }
    const def = this.goals.getLevelDef();
    const arenaColor = circles.length > 0
      ? LEVELS[topLevel].color
      : (th?.arenaBase || LEVELS[def.goals.reduce((mx, g) => Math.max(mx, g.level), 0)]?.color || LEVELS[0].color);

    // Arena — U şekli (üst açık)
    const mFlash = state.mainBorderFlash > 0 ? state.mainBorderFlash / 40 : 0;
    const mBlur = 7 + mFlash * 22;
    const openAngle = Math.PI * 0.50; // her yanda 90° — tam U harfi
    const arcStart = -Math.PI / 2 + openAngle; // sağ duvar başlangıcı
    const arcEnd   = -Math.PI / 2 - openAngle; // sol duvar bitişi
    ctx.save();
    ctx.shadowColor = arenaColor; ctx.shadowBlur = mBlur; ctx.strokeStyle = arenaColor;
    ctx.lineWidth = Math.round(4 * S); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(CX, CY, MAIN_R, arcStart, arcEnd + Math.PI * 2); ctx.stroke();
    if (mFlash > 0) {
      ctx.shadowBlur = mBlur * 1.5;
      ctx.beginPath(); ctx.arc(CX, CY, MAIN_R, arcStart, arcEnd + Math.PI * 2); ctx.stroke();
    }
    // U duvarları — dik çizgiler (gerçek U harfi görünümü)
    const lx1 = CX + Math.cos(arcStart) * MAIN_R, ly1 = CY + Math.sin(arcStart) * MAIN_R;
    const lx2 = CX + Math.cos(arcEnd) * MAIN_R,   ly2 = CY + Math.sin(arcEnd) * MAIN_R;
    ctx.strokeStyle = arenaColor; ctx.lineWidth = Math.round(4 * S);
    ctx.shadowColor = arenaColor; ctx.shadowBlur = mBlur;
    ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx1, CY - MAIN_R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx2, ly2); ctx.lineTo(lx2, CY - MAIN_R); ctx.stroke();
    if (mFlash > 0) {
      ctx.shadowBlur = mBlur * 1.5;
      ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx1, CY - MAIN_R); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx2, ly2); ctx.lineTo(lx2, CY - MAIN_R); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // nextBall göstergesi — orta üst
    if (state.nextBall) {
      const nb = state.nextBall;
      ctx.save();

      // Timer arc — kaç saniye kaldı
      if (state.autoDropDeadline > 0) {
        const remaining = Math.max(0, state.autoDropDeadline - Date.now());
        const progress = remaining / 4000; // 1→0
        const arcR = nb.r + 8 * S;
        // Arka arc (soluk)
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, arcR, -Math.PI/2, -Math.PI/2 + Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 3 * S; ctx.stroke();
        // Kalan süre arc
        const urgency = progress < 0.3; // son saniyede kırmızı
        ctx.beginPath();
        ctx.arc(nb.x, nb.y, arcR, -Math.PI/2, -Math.PI/2 + Math.PI*2*progress);
        ctx.strokeStyle = urgency ? '#FF4444' : nb.color;
        ctx.lineWidth = 3 * S;
        ctx.shadowColor = urgency ? '#FF4444' : nb.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      R.drawSphere({ ...nb, boing:0, absorbAnim:0, squish:null, absorbGlow:0, isBeingDragged:false, contains:[] });
      ctx.restore();
    }

    // heldBall — parmakla taşınan top
    if (state.heldBall) {
      const hb = state.heldBall;
      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.shadowColor = hb.color; ctx.shadowBlur = 18;
      R.drawSphere({ ...hb, boing:0, absorbAnim:0, squish:null, absorbGlow:0, isBeingDragged:true, contains:[] });
      ctx.restore();
    }

    // Parçacıklar
    R.drawParticles();

    // Chain dalgaları
    R.drawChainWaves();

    // Hedefler
    R.drawGoals(this.goals);

    // Toplar
    for (const c of circles) R.drawSphere(c);

    // Absorb animasyonu
    R.drawAbsorbAnims();

    // Tutorial ipuçları (sadece tutorial'da)
    if (state.currentLevel < TUTORIAL_LEVELS) {
      this.hints.draw();
      if (state.currentLevel === 0) this.tutorial.drawHint();
    }

    // Hint zincirleri — her levelda göster
    this.hints.drawAllChains(this.goals);

    // Success overlay
    R.drawSuccessOverlay(this.goals);

    // Blast
    const bRect = this.blast.getBtnRect();
    if (bRect) R.drawBlastBtn(bRect, !state.levelSuccess && this.blast.isEnabled(bRect));
    R.drawBlastProjectiles();

    // Tutorial ipucu

    // Hint zincirleri

    // Action + combo metinleri
    R.drawActionTexts();
    R.drawComboDisplays();

    // Pause butonu
    // Palet rehberi — sol üst köşe
    if (!state.levelSuccess && !state.gameOver) R.drawPaletteGuide();

    R.drawPauseBtn();
    if (state.isPaused) {
      R.drawPauseOverlay();
    } else {
      state._resumeBtn = null;
    }

    // Game over
    if (state.gameOver) R.drawGameOver(this.goals);
  }

  // ── Ana döngü ─────────────────────────────────────────────────────
  _loop() {
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
    requestAnimationFrame(() => this._loop());
  }
}
