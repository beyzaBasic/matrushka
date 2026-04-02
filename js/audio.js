// ── audio.js ───────────────────────────────────────────────────────
export class AudioManager {
  constructor() {
    this._sounds = {};
    this._ready  = false;
    this._init();
  }

  _init() {
    if (typeof Howl === 'undefined') {
      console.warn('Howler.js yüklenmedi — ses kapalı.');
      return;
    }
    const files = {
      spawn:         { src: ['sounds/spawn.mp3'],         volume: 0.5 },
      merge:         { src: ['sounds/merge.mp3'],         volume: 0.65 },
      absorb:        { src: ['sounds/absorb.mp3'],        volume: 0.6  },
      goalDone:      { src: ['sounds/goalDone.mp3'],      volume: 0.7  },
      levelComplete: { src: ['sounds/levelComplete.mp3'], volume: 0.8  },
      gameOver:      { src: ['sounds/gameOver.mp3'],      volume: 0.7  },
      combo:         { src: ['sounds/combo.wav'],         volume: 0.6  },
      blast:         { src: ['sounds/blast.mp3'],         volume: 0.75 },
      pick:          { src: ['sounds/pick.mp3'],          volume: 0.4  },
    };
    for (const [key, opts] of Object.entries(files)) {
      this._sounds[key] = new Howl({ ...opts, preload: true });
    }
    this._ready = true;
  }

  _play(key) {
    if (!this._ready) return;
    const s = this._sounds[key];
    if (s) s.play();
  }

  // ── Public API (game.js ile aynı imza) ──────────────────────────
  unlock() {}                        // Howler autoUnlock halleder
  spawn()              { this._play('spawn'); }
  merge(level)         { this._play('merge'); }
  absorb(level)        { this._play('absorb'); }
  goalDone()           { this._play('goalDone'); }
  levelComplete()      { this._play('levelComplete'); }
  gameOver()           { this._play('gameOver'); }
  combo(count, rate = 1.0) {
    if (!this._ready) return;
    const s = this._sounds['combo'];
    if (s) { s.rate(rate); s.play(); }
  }
  blast()              { this._play('blast'); }
  pick()               { this._play('pick'); }
}
