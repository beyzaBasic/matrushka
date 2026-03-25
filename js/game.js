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

    this._applyLayout();
    this._setupInput();
    window.addEventListener('resize', () => { this._applyLayout(); });
  }

  // ── Layout ────────────────────────────────────────────────────────
  _applyLayout() {
    const L = buildLayout();
    Object.assign(state, L);
    state.LEVELS = buildLevels(L.MAIN_R);
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
      if (gb && x >= gb.x && x <= gb.x + gb.w && y >= gb.y && y <= gb.y + gb.h) this._resetGame();
      return;
    }

    const pb = state._pauseBtn;
    if (pb && x >= pb.x && x <= pb.x + pb.w && y >= pb.y && y <= pb.y + pb.h) {
      state.isPaused = !state.isPaused;
      if (!state.isPaused) state.lastSpawn = Date.now();
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

    // Top sürükleme veya dünya döndürme
    const { CX, CY, MAIN_R, S } = state;
    const distFromCenter = Math.hypot(x - CX, y - CY);
    const found = state.circles.slice().reverse().find(c => Math.hypot(x - c.x, y - c.y) < Math.max(c.r * 1.5, 44 * S));
    if (found) {
      state.draggedCircle = found;
      state.draggedCircle.isBeingDragged = true;
      this.audio.pick();
    } else if (distFromCenter > MAIN_R - 55 * S) {
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
  start() {
    this._resetGame();
    requestAnimationFrame(() => this._loop());
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
    this.goals.initLevelGoals();
    this._preloadArena();
  }

  _nextLevel() {
    state.currentLevel++;
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
    this.goals.initLevelGoals();
    this._preloadArena();
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

  // ── Spawn ─────────────────────────────────────────────────────────
  _countPinks() {
    let n = 0;
    for (const c of state.circles) {
      if (c.level === 0) n++;
      if (c.contains) n += c.contains.filter(lv => lv === 0).length;
    }
    return n;
  }

  _spawnCircle() {
    const { CX, CY, MAIN_R, LEVELS } = state;
    const roll = Math.random();
    let lv;
    if (this._countPinks() >= 10) {
      lv = roll < 0.70 ? 1 : 2;
    } else if (state.currentLevel === 0) {
      const { mid, hi } = this.goals.getSpawnLevels(); lv = roll < 0.70 ? mid : hi;
    } else {
      const { lo, mid, hi } = this.goals.getSpawnLevels(); lv = roll < 0.50 ? lo : roll < 0.85 ? mid : hi;
    }
    const lr = LEVELS[lv].r;
    const safeRange = (MAIN_R - lr) * 0.88;
    const spawnX = CX + (Math.random() * 2 - 1) * safeRange;
    const dx2 = spawnX - CX;
    const spawnY = CY - Math.sqrt(Math.max(0, (MAIN_R - lr - 2) ** 2 - dx2 ** 2));
    state.circles.push({ id: Math.random(), x: spawnX, y: spawnY, r: lr, level: lv, color: LEVELS[lv].color, vx: (Math.random() - 0.5) * 1.2, vy: LEVELS[lv].vy, contains: [], absorbAnim: 0, isBeingDragged: false, boing: 0, absorbGlow: 0 });
    this.audio.spawn();
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
          if (currentLevel === 1 && !state.levelSuccess) {
            setTimeout(() => {
              if (!state.levelSuccess && !this.physics.sceneHasAbsorbPending()) {
                const { CX, CY, MAIN_R } = state;
                const _lr = LEVELS[2].r, _sx = CX + (Math.random() * 2 - 1) * (MAIN_R - _lr) * 0.8;
                const _sy = CY - Math.sqrt(Math.max(0, (MAIN_R - _lr - 2) ** 2 - (_sx - CX) ** 2));
                state.circles.push({ id: Math.random(), x: _sx, y: _sy, r: _lr, level: 2, color: LEVELS[2].color, vx: (Math.random() - 0.5) * 1.2, vy: LEVELS[2].vy, contains: [], absorbAnim: 0, isBeingDragged: false, boing: 0, absorbGlow: 0 });
                state.lastSpawn = Date.now();
              }
            }, 1200);
          }
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
            if (currentLevel === 1 && !state.levelSuccess) {
              setTimeout(() => {
                if (!state.levelSuccess && !this.physics.sceneHasAbsorbPending()) {
                  const { CX, CY, MAIN_R } = state;
                  const _lr = LEVELS[2].r, _sx = CX + (Math.random() * 2 - 1) * (MAIN_R - _lr) * 0.8;
                  const _sy = CY - Math.sqrt(Math.max(0, (MAIN_R - _lr - 2) ** 2 - (_sx - CX) ** 2));
                  state.circles.push({ id: Math.random(), x: _sx, y: _sy, r: _lr, level: 2, color: LEVELS[2].color, vx: (Math.random() - 0.5) * 1.2, vy: LEVELS[2].vy, contains: [], absorbAnim: 0, isBeingDragged: false, boing: 0, absorbGlow: 0 });
                  state.lastSpawn = Date.now();
                }
              }, 1200);
            }
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

    // Spawn
    const spawnBlocked = false;
    if (!state.gameOver && !state.levelSuccess && state.introDropsDone && now - state.lastSpawn > 1400
        && state.currentLevel !== 0 && state.currentLevel !== 1 && !spawnBlocked) {
      this._spawnCircle(); state.lastSpawn = now;
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
    }

    if (state.gameOver) state.gameOverAlpha = Math.min(1, state.gameOverAlpha + 0.06);
  }

  // ── Draw loop ─────────────────────────────────────────────────────
  _draw() {
    const R = this.renderer;
    const { ctx, W, H, CX, CY, MAIN_R, S, circles, LEVELS } = state;

    // Arka plan
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d0a1a'); bg.addColorStop(0.5, '#0a0f1e'); bg.addColorStop(1, '#060810');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Arena rengi — sahnedeki en yüksek level
    let topLevel = 0;
    for (const cc of circles) { if (cc.level > topLevel) topLevel = cc.level; for (const lv of cc.contains) if (lv > topLevel) topLevel = lv; }
    const def = this.goals.getLevelDef();
    const arenaColor = circles.length > 0 ? LEVELS[topLevel].color : (LEVELS[def.goals.reduce((mx, g) => Math.max(mx, g.level), 0)]?.color || LEVELS[0].color);

    // Arena çemberi
    const mFlash = state.mainBorderFlash > 0 ? state.mainBorderFlash / 40 : 0;
    const mBlur = 7 + mFlash * 22;
    ctx.save();
    ctx.shadowColor = arenaColor; ctx.shadowBlur = mBlur; ctx.strokeStyle = arenaColor;
    ctx.lineWidth = Math.round(4 * S); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(CX, CY, MAIN_R, 0, Math.PI * 2); ctx.stroke();
    if (mFlash > 0) { ctx.shadowBlur = mBlur * 1.5; ctx.beginPath(); ctx.arc(CX, CY, MAIN_R, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();

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

    // Tutorial ipuçları (sadece level 0)
    if (state.currentLevel < TUTORIAL_LEVELS) {
      this.hints.draw();
      if (state.currentLevel === 0) this.tutorial.drawHint();
      this.hints.drawAllChains(this.goals);
    }

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
