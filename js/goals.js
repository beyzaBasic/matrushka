// ── goals.js ──────────────────────────────────────────────────────
import { state } from './state.js';
import { LEVEL_DEFS, TUTORIAL_LEVELS } from './constants.js';
import { getWorldConfig, cpIdxFromLevel } from './world-config.js';

export class GoalManager {
  getLevelDef() {
    return LEVEL_DEFS[Math.min(state.currentLevel, LEVEL_DEFS.length - 1)];
  }

  displayLevel() {
    return state.currentLevel < TUTORIAL_LEVELS ? null : state.currentLevel - TUTORIAL_LEVELS + 1;
  }

  displayLevelText() {
    return state.currentLevel < TUTORIAL_LEVELS
      ? 'How to Play ' + (state.currentLevel + 1)
      : 'Level ' + this.displayLevel();
  }

  initLevelGoals() {
    state.goalSlots = this.getLevelDef().goals.map(() => null);
    state.flyingGoals = [];
    state.levelSuccess = false;
    state.levelSuccessAlpha = 0;
  }

  goalSlotPos(idx) {
    const { CX, MIN_DIM } = state;
    const n = this.getLevelDef().goals.length;
    const GEM_R = n <= 1 ? 64 : n === 2 ? 54 : 44;
    const TOP = 10, TTL = Math.round(28 * MIN_DIM / 800) + 8, MID = 4;
    const gemTop = TOP + TTL + MID, gap = Math.round(GEM_R * 0.42);
    const totalW = n * GEM_R * 2 + (n - 1) * gap, startX = CX - totalW / 2 + GEM_R;
    const ballR = Math.round(GEM_R * 0.72);
    return {
      cx: startX + idx * (GEM_R * 2 + gap), cy: gemTop + GEM_R, gemR: GEM_R, ballR,
      x: startX + idx * (GEM_R * 2 + gap) - GEM_R, y: gemTop, w: GEM_R * 2, h: GEM_R * 2, r: ballR
    };
  }

  goalsMatch(c, g) {
    if (c.level !== g.level || c.contains.length !== g.contains.length) return false;
    const a = [...c.contains].sort((a, b) => a - b), b = [...g.contains].sort((a, b) => a - b);
    return a.every((v, i) => v === b[i]);
  }

  checkGoal(c) {
    const def = this.getLevelDef();
    for (let i = 0; i < def.goals.length; i++) {
      if (state.goalSlots[i] !== null) continue;
      if (this.goalsMatch(c, def.goals[i])) {
        const sp = this.goalSlotPos(i);
        state.flyingGoals.push({ slotIdx: i, x: c.x, y: c.y, tx: sp.cx, ty: sp.cy, r: sp.r, level: c.level, contains: [...c.contains], t: 0, maxT: 72 });
        state.goalSlots[i] = 'flying'; return true;
      }
    }
    return false;
  }

  getSpawnLevels() {
    const def = this.getLevelDef(); let minLv = 6;
    for (const g of def.goals) {
      const inner = g.contains.length ? g.contains[g.contains.length - 1] : g.level;
      if (inner < minLv) minLv = inner;
    }
    return { lo: Math.max(0, minLv - 1), mid: minLv, hi: Math.min(state.LEVELS.length - 1, minLv + 1) };
  }

  updateFlyingGoals(audio) {
    const { flyingGoals, goalSlots, particles, chainWaves, circles, LEVELS, S, CX, CY, MAIN_R } = state;
    for (let i = flyingGoals.length - 1; i >= 0; i--) {
      const fg = flyingGoals[i];
      if (!fg.sx) { fg.sx = fg.x; fg.sy = fg.y; fg.spinA = 0; }
      fg.t++; fg.spinA = (fg.spinA || 0) + 0.08;
      const pp = Math.min(1, fg.t / fg.maxT), ep = 1 - (1 - pp) * (1 - pp) * (1 - pp);
      fg.x = fg.sx + (fg.tx - fg.sx) * ep;
      fg.y = fg.sy + (fg.ty - fg.sy) * ep - Math.sin(pp * Math.PI) * 140 * S;
      fg.r = LEVELS[fg.level].r * (pp < 0.85 ? 1.0 : 1.0 - (pp - 0.85) / 0.15 * 0.38);
      if (fg.t >= fg.maxT) {
        goalSlots[fg.slotIdx] = 'done';
        flyingGoals.splice(i, 1);
        const sc = LEVELS[fg.level].color;
        for (let p = 0; p < 34; p++) {
          const a = p / 34 * Math.PI * 2, sp = (3 + Math.random() * 7) * S;
          particles.push({ x: fg.tx, y: fg.ty, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * S, r: (4 + Math.random() * 6) * S, color: sc, life: 55, maxLife: 55 });
        }
        this._celebrate(fg.tx, fg.ty, '#fff');
        this._celebrate(fg.tx, fg.ty, '#FFD700');
        chainWaves.push({ x: fg.tx, y: fg.ty, r: LEVELS[fg.level].r * 0.3, maxR: LEVELS[fg.level].r * 3.2, color: '#FFD700', t: 0, maxT: 28 });
        state.mainBorderFlash = 45;
        audio.goalDone();
        if (goalSlots.every(s => s === 'done')) {
          state.levelSuccess = true;
          state.levelStars = state.blastUsedThisLevel === 0 ? 3 : state.blastUsedThisLevel <= 1 ? 2 : 1;
          audio.levelComplete();
          const cpIdx = cpIdxFromLevel(state.currentLevel, TUTORIAL_LEVELS);
          const palette = getWorldConfig(cpIdx).palette;
          const cols = [...palette, '#fff', '#FFD700'];
          for (let p = 0; p < 50; p++) {
            const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * 8) * S;
            particles.push({ x: CX + (Math.random() - 0.5) * MAIN_R, y: CY + (Math.random() - 0.5) * MAIN_R, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * S, r: (4 + Math.random() * 7) * S, color: cols[Math.floor(Math.random() * cols.length)], life: 100, maxLife: 100 });
          }
        }
      }
    }
    if (state.levelSuccess) state.levelSuccessAlpha = Math.min(1, state.levelSuccessAlpha + 0.06);
  }

  _celebrate(x, y, color) {
    const { S } = state;
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (3 + Math.random() * 7) * S;
      state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 5 * S, r: (5 + Math.random() * 9) * S, color, life: 55 + Math.random() * 30, maxLife: 85 });
    }
  }
}
