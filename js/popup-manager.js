// ── popup-manager.js ──────────────────────────────────────────────
// Centralised HTML popup / modal layer for all in-game windows.
// Usage:
//   import { popupManager } from './popup-manager.js';
//   popupManager.show({ badge, icon, iconStyle, label, title, subtitle,
//                        buttons, mainCol, darkCol });
//   popupManager.hide(callback);

const FONT = '"ui-rounded","Arial Rounded MT Bold",sans-serif';

function _injectStyles() {
  if (document.getElementById('_pmStyles')) return;
  const s = document.createElement('style');
  s.id = '_pmStyles';
  s.textContent = `
    @keyframes _pmFade   { from{opacity:0}          to{opacity:1} }
    @keyframes _pmPop    { from{transform:scale(0.5) rotate(-4deg);opacity:0}
                           to{transform:scale(1)    rotate(0deg);opacity:1} }
    @keyframes _pmBounce { 0%,100%{transform:translateY(0) scale(1)}
                           35%{transform:translateY(-18px) scale(1.14)}
                           65%{transform:translateY(5px)  scale(0.96)} }
    @keyframes _pmShine  { 0%{background-position:200% center}
                           100%{background-position:-200% center} }
    @keyframes _pmPulse  { 0%,100%{box-shadow:0 0 32px var(--pm-glow),0 16px 48px rgba(0,0,0,.5)}
                           50% {box-shadow:0 0 72px var(--pm-glow),0 16px 48px rgba(0,0,0,.5)} }
  `;
  document.head.appendChild(s);
}

class PopupManager {
  constructor() {
    this._overlay = null;
  }

  /**
   * Show a popup. Any existing popup is dismissed instantly.
   *
   * @param {object} cfg
   * @param {string}      [cfg.badge]      — chip text pinned above the card
   * @param {HTMLElement} [cfg.icon]       — element shown as the icon
   * @param {string}      [cfg.iconStyle]  — CSS for the icon wrapper div
   * @param {string}      [cfg.label]      — small label above the title
   * @param {string}      [cfg.title]      — large title (gets shimmer gradient)
   * @param {string}      [cfg.subtitle]   — muted text below title
   * @param {Array}       [cfg.buttons]    — [{ text, primary?, onClick }]
   * @param {string}      [cfg.mainCol]    — primary hex colour (#rrggbb)
   * @param {string}      [cfg.darkCol]    — secondary hex colour (#rrggbb)
   */
  show({
    badge     = null,
    icon      = null,
    iconStyle = 'display:block;margin:0 auto 10px;animation:_pmBounce 1.3s ease 0.3s both;',
    label     = null,
    title     = null,
    subtitle  = null,
    buttons   = [],
    mainCol   = '#FFD700',
    darkCol   = '#FF9500',
  } = {}) {
    _injectStyles();
    this._removeOverlay();

    // ── Backdrop ──────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:500;display:flex;align-items:center;' +
      'justify-content:center;background:rgba(0,0,0,0.78);animation:_pmFade 0.35s ease;';

    // ── Card ──────────────────────────────────────────────────────
    const card = document.createElement('div');
    card.style.cssText = `
      --pm-glow:${mainCol}77;
      background:linear-gradient(160deg,#0d0820 0%,#1e1040 55%,#0d0820 100%);
      border-radius:32px;padding:40px 32px 32px;text-align:center;
      box-shadow:0 0 60px ${mainCol}55,0 24px 64px rgba(0,0,0,0.6);
      border:2px solid ${mainCol}55;max-width:320px;width:86%;position:relative;
      animation:_pmPop 0.45s cubic-bezier(0.34,1.56,0.64,1),
                _pmPulse 2.8s ease-in-out 0.5s infinite;`;

    // ── Badge ─────────────────────────────────────────────────────
    if (badge) {
      const el = document.createElement('div');
      el.textContent = badge;
      el.style.cssText =
        `position:absolute;top:-16px;left:50%;transform:translateX(-50%);` +
        `background:linear-gradient(90deg,${mainCol},${darkCol},${mainCol});` +
        `background-size:200% auto;animation:_pmShine 2s linear infinite;` +
        `color:#000;font-weight:900;font-size:11px;letter-spacing:3px;padding:6px 22px;` +
        `border-radius:20px;font-family:${FONT};` +
        `box-shadow:0 3px 16px ${mainCol}88;white-space:nowrap;`;
      card.appendChild(el);
    }

    // ── Icon ──────────────────────────────────────────────────────
    if (icon) {
      const wrap = document.createElement('div');
      wrap.style.cssText = iconStyle;
      wrap.appendChild(icon);
      card.appendChild(wrap);
    }

    // ── Label ─────────────────────────────────────────────────────
    if (label) {
      const el = document.createElement('div');
      el.textContent = label;
      el.style.cssText =
        `color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:4px;` +
        `font-family:${FONT};margin-bottom:6px;`;
      card.appendChild(el);
    }

    // ── Title (shimmer gradient) ───────────────────────────────────
    if (title) {
      const el = document.createElement('div');
      el.textContent = title;
      el.style.cssText =
        `background:linear-gradient(90deg,${mainCol},#fff,${darkCol});` +
        `background-size:200% auto;animation:_pmShine 2s linear infinite;` +
        `-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;` +
        `font-size:28px;font-weight:900;letter-spacing:1px;` +
        `font-family:${FONT};margin-bottom:8px;`;
      card.appendChild(el);
    }

    // ── Subtitle ──────────────────────────────────────────────────
    if (subtitle) {
      const el = document.createElement('div');
      el.textContent = subtitle;
      el.style.cssText =
        `color:rgba(255,255,255,0.38);font-size:13px;` +
        `font-family:${FONT};margin-bottom:28px;`;
      card.appendChild(el);
    }

    // ── Buttons ───────────────────────────────────────────────────
    if (buttons.length > 0) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
      for (const { text, primary = true, onClick } of buttons) {
        const btn = document.createElement('div');
        btn.textContent = text;
        if (primary) {
          btn.style.cssText =
            `background:linear-gradient(135deg,${mainCol},${darkCol});` +
            `color:#000;font-weight:900;font-size:15px;letter-spacing:2px;` +
            `padding:16px 40px;border-radius:50px;cursor:pointer;display:inline-block;` +
            `font-family:${FONT};` +
            `box-shadow:0 4px 28px ${mainCol}77;transition:transform 0.12s,box-shadow 0.12s;`;
          btn.addEventListener('pointerdown', () => {
            btn.style.transform = 'scale(0.94)';
            btn.style.boxShadow = `0 2px 12px ${mainCol}44`;
          });
          btn.addEventListener('pointerup', () => {
            btn.style.transform = '';
            btn.style.boxShadow = `0 4px 28px ${mainCol}77`;
          });
        } else {
          btn.style.cssText =
            `color:rgba(255,255,255,0.50);font-size:13px;letter-spacing:1px;` +
            `padding:10px 20px;cursor:pointer;font-family:${FONT};transition:color 0.12s;`;
          btn.addEventListener('pointerenter', () => { btn.style.color = 'rgba(255,255,255,0.85)'; });
          btn.addEventListener('pointerleave', () => { btn.style.color = 'rgba(255,255,255,0.50)'; });
        }
        btn.addEventListener('click', () => { onClick?.(); });
        wrap.appendChild(btn);
      }
      card.appendChild(wrap);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this._overlay = overlay;
  }

  /**
   * Fade-out and remove the current popup.
   * @param {Function} [callback] — called after the fade completes
   */
  hide(callback) {
    if (!this._overlay) { callback?.(); return; }
    const overlay = this._overlay;
    this._overlay = null;
    overlay.style.transition = 'opacity 0.25s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      callback?.();
    }, 260);
  }

  /** Remove overlay immediately with no animation */
  _removeOverlay() {
    if (!this._overlay) return;
    this._overlay.remove();
    this._overlay = null;
  }

  isOpen() { return !!this._overlay; }
}

export const popupManager = new PopupManager();
