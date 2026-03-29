// ── state.js ──────────────────────────────────────────────────────
// Tüm modüllerin paylaştığı tek state objesi

export const state = {
  // Canvas / context (game.js init eder)
  canvas: null, ctx: null,
  // Layout (game.js her resize'da günceller)
  W: 0, H: 0, CX: 0, CY: 0, MAIN_R: 0, S: 1,
  MIN_DIM: 0, DPR: 1, CSS_W: 0, CSS_H: 0,
  SCORE_AREA: 230, BTN_PAD: 12, BTN_BOTTOM_PAD: 12,
  LEVELS: [],
  theme: null,
  // Oyun nesneleri
  circles: [], particles: [], chainWaves: [], absorbingInto: [],
  blastAnims: [], blastBtnAnim: { id: null, t: 0 },
  actionTexts: [], comboDisplays: [], hintPairs: [],
  // Level / goal
  currentLevel: 0, goalSlots: [], flyingGoals: [],
  levelSuccess: false, levelSuccessAlpha: 0,
  levelStars: 0, blastUsedThisLevel: 0, introDropsDone: false,
  // Tutorial
  tut0Step: -1, tut0Transitioning: false, _step1Spawned: false,
  // Oyun durumu
  gameOver: false, gameOverAlpha: 0, isPaused: false, mapVisible: false,
  nextBall: null, heldBall: null, ballDropped: false,
  autoDropTimer: 0, autoDropDeadline: 0,
  lastSpawn: 0, mainBorderFlash: 0,
  combo: 0, comboTimer: 0,
  frameCount: 0, gameTime: 0, lastComboFrame: -1,
  // Input / rotation
  worldRot: 0, rotVel: 0, lastAngle: 0,
  isDraggingWorld: false, draggedCircle: null,
  mousePos: { x: 0, y: 0 }, prevMousePos: { x: 0, y: 0 }, mouseVel: { x: 0, y: 0 },
  // Blast
  BLAST_BTNS: [],
  // Audio (game.js init eder)
  audio: null,
  // UI hit areas
  _pauseBtn: null, _resumeBtn: null, _nextLevelBtn: null, _gameOverBtn: null,
};
