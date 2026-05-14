// ── game-popups.js ────────────────────────────────────────────────────────────
// HTML-based in-game popups: success, gameover, pause, tutorial

function _el(id) { return document.getElementById(id); }

class GamePopups {
  constructor() {
    this._current = null; // 'gp-success' | 'gp-gameover' | 'gp-tutorial'
  }

  showSuccess(stars, ctaLabel, palette, onNext) {
    _el('gp-success').querySelectorAll('.gp-star').forEach((s, i) => {
      s.classList.toggle('on', i < stars);
    });
    _el('gp-success-cta').textContent = ctaLabel;
    _el('gp-success-cta').onclick = () => this.hide(() => onNext?.());
    this._spawnConfetti(palette, 'gp-success-confetti');
    this._show('gp-success');
  }

  showGameOver(levelText, onRetry) {
    _el('gp-gameover-level').textContent = levelText;
    _el('gp-gameover-cta').onclick = () => this.hide(() => onRetry?.());
    this._show('gp-gameover');
  }

  showPause(onResume) {
    _el('gp-pause-cta').onclick = () => { this.hidePause(); onResume?.(); };
    const el = _el('gp-pause');
    el.removeAttribute('hidden');
    requestAnimationFrame(() => el.classList.add('gp-visible'));
  }

  hidePause(callback) {
    const el = _el('gp-pause');
    if (!el || el.hidden) { callback?.(); return; }
    el.classList.remove('gp-visible');
    setTimeout(() => { el.setAttribute('hidden', ''); callback?.(); }, 290);
  }

  showTutorial(onPlay) {
    this._spawnConfetti(null, 'gp-tutorial-confetti');
    _el('gp-tutorial-cta').onclick = () => this.hide(() => onPlay?.());
    this._show('gp-tutorial');
  }

  hide(callback) {
    if (!this._current) { callback?.(); return; }
    const el = _el(this._current);
    if (!el) { this._current = null; callback?.(); return; }
    el.classList.remove('gp-visible');
    const id = this._current;
    this._current = null;
    setTimeout(() => { _el(id)?.setAttribute('hidden', ''); callback?.(); }, 290);
  }

  forceHide() {
    ['gp-success','gp-gameover','gp-tutorial','gp-pause'].forEach(id => {
      const el = _el(id);
      if (el) { el.classList.remove('gp-visible'); el.setAttribute('hidden', ''); }
    });
    this._current = null;
  }

  isOpen() { return !!this._current; }

  _show(id) {
    if (this._current && this._current !== id) {
      _el(this._current)?.setAttribute('hidden', '');
    }
    this._current = id;
    const el = _el(id);
    el.removeAttribute('hidden');
    requestAnimationFrame(() => el.classList.add('gp-visible'));
  }

  _spawnConfetti(colors, containerId = 'gp-success-confetti') {
    const cols = (colors?.length ? colors : ['#FFD700','#FF6D00','#E91E8C','#9B27FF','#2979FF','#00E5FF','#00E676']);
    const c = _el(containerId);
    if (!c) return;
    c.innerHTML = '';
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('div');
      p.className = 'gp-confetti-p';
      const size = 5 + Math.random() * 7;
      p.style.cssText = [
        `left:${(Math.random()*100).toFixed(1)}%`,
        `background:${cols[i % cols.length]}`,
        `animation-delay:${(Math.random()*0.9).toFixed(2)}s`,
        `animation-duration:${(1.1 + Math.random()*0.9).toFixed(2)}s`,
        `width:${size.toFixed(1)}px`,
        `height:${size.toFixed(1)}px`,
        `border-radius:${Math.random() > 0.5 ? '50%' : '3px'}`,
      ].join(';');
      c.appendChild(p);
    }
  }
}

export const gamePopups = new GamePopups();
