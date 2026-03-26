// ── map.js ────────────────────────────────────────────────────────
import { getWorldConfig, cpLevelRange, LEVELS_PER_CP, TOTAL_CHECKPOINTS } from './world-config.js';

// ── Test modu: true yapınca tüm checkpoint'ler açık, tıklayınca direkt gider ──
const TEST_MODE = true;

// ── Yardımcılar ───────────────────────────────────────────────────
function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

function hexToRGB(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function getProgress() {
  try { return JSON.parse(localStorage.getItem('matrushka_progress') || '{}'); }
  catch(e) { return {}; }
}

function saveProgress(completedLevel) {
  const p = getProgress();
  p.completedLevel = Math.max(p.completedLevel || 0, completedLevel);
  localStorage.setItem('matrushka_progress', JSON.stringify(p));
}

// ── MapScreen ─────────────────────────────────────────────────────
export class MapScreen {
  constructor() {
    this._app       = null;
    this._div       = null;   // PixiJS canvas wrapper
    this._onSelect  = null;
    this._spheres   = [];
    this._scrollY   = 0;
    this._targetY   = 0;
    this._worldH    = 0;
    this._bgRGB     = { r: 10, g: 10, b: 15 };
    this._rain      = [];
    this._rainOn    = false;
    this._rainCols  = [];
    this._startBtn  = null;
    this._contBtn   = null;
    this._built     = false;
  }

  // ── Public ────────────────────────────────────────────────────────
  show(onSelect) {
    this._onSelect = onSelect;
    this._build();
    this._div.style.display = 'block';
    requestAnimationFrame(() => { this._div.style.opacity = '1'; });
  }

  hide() {
    if (!this._div) return;
    this._div.style.opacity = '0';
    this._hideStartBtn();
    setTimeout(() => {
      if (this._div) this._div.style.display = 'none';
    }, 400);
  }

  showCheckpoint(cpIdx, onDone) {
    saveProgress((cpIdx + 1) * LEVELS_PER_CP);
    this._build();
    this._div.style.display = 'block';
    requestAnimationFrame(() => { this._div.style.opacity = '1'; });

    // Scroll ve aç
    const pos = this._cpPos(cpIdx);
    const H = this._app.screen.height;
    this._targetY = Math.max(0, Math.min(this._worldH - H, pos.y - H / 2));

    setTimeout(() => {
      const sp = this._spheres[cpIdx];
      if (sp) { sp.isOpen = true; sp.targetOpenT = 1; }
      this._rainOn = true;
      this._rainCols = getWorldConfig(cpIdx).palette;
      setTimeout(() => { this._showContBtn(onDone); }, 2500);
    }, 800);
  }

  // ── Build (bir kez) ───────────────────────────────────────────────
  _build() {
    if (this._built) return;
    this._built = true;

    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Wrapper div — opacity transition için
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 100; display: none; opacity: 0;
      transition: opacity 0.4s;
    `;
    div.appendChild(app.view);
    app.view.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
    document.body.appendChild(div);

    this._app  = app;
    this._div  = div;

    const W = app.screen.width, H = app.screen.height;
    this._worldH = H * 0.18 * TOTAL_CHECKPOINTS + H * 0.5;

    // Containers
    this._world = new PIXI.Container();
    app.stage.addChild(this._world);
    this._rainLayer = new PIXI.Container();
    app.stage.addChild(this._rainLayer);

    this._drawPath(W);
    this._buildSpheres();
    this._drawLevelDots();
    this._scrollToActive();
    this._bindScroll();

    // Game loop
    app.ticker.add((dt) => this._tick(dt));
  }

  // ── Pozisyon ──────────────────────────────────────────────────────
  _cpPos(idx) {
    const W = this._app.screen.width;
    const H = this._app.screen.height;
    const t = idx / (TOTAL_CHECKPOINTS - 1);
    const y = this._worldH - H * 0.12 - t * (this._worldH - H * 0.25);
    const x = W / 2 + Math.sin(idx * 0.95 + 0.3) * W * 0.22;
    return { x, y };
  }

  // ── Yol ───────────────────────────────────────────────────────────
  _drawPath(W) {
    const g = new PIXI.Graphics();
    const pts = Array.from({ length: TOTAL_CHECKPOINTS }, (_, i) => this._cpPos(i));

    g.lineStyle({ width: 2, color: 0xffffff, alpha: 0.15 });
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      g.quadraticCurveTo(p.x, p.y, (p.x + c.x) / 2, (p.y + c.y) / 2);
    }
    g.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    this._world.addChild(g);
  }

  // ── Sphere'ler ────────────────────────────────────────────────────
  _buildSpheres() {
    const progress  = getProgress();
    const doneCPs   = Math.floor((progress.completedLevel || 0) / LEVELS_PER_CP);
    const activeCPs = Math.min(doneCPs, TOTAL_CHECKPOINTS - 1);

    this._spheres = [];
    for (let i = 0; i < TOTAL_CHECKPOINTS; i++) {
      const pos     = this._cpPos(i);
      const world   = getWorldConfig(i);
      const locked  = TEST_MODE ? false : (i > activeCPs && i > 0);
      const done    = i < doneCPs;
      const active  = i === activeCPs;

      const sp = {
        idx: i, world, locked, done, active,
        x: pos.x, y: pos.y,
        baseR: 36,
        openT: 0, targetOpenT: 0,
        pulseT: Math.random() * Math.PI * 2,
        hovered: false, isOpen: false,
        gfx: new PIXI.Graphics(),
        container: new PIXI.Container(),
      };

      sp.container.x = pos.x;
      sp.container.y = pos.y;
      sp.container.addChild(sp.gfx);

      // Label
      const { lo, hi } = cpLevelRange(i);
      const lbl = new PIXI.Text(`${lo}–${hi}`, {
        fontFamily: 'Georgia,serif', fontSize: 10,
        fill: 0xffffff, letterSpacing: 1,
      });
      lbl.anchor.set(0.5, 0);
      lbl.y = sp.baseR + 10;
      lbl.alpha = locked ? 0.2 : 0.65;
      sp.container.addChild(lbl);

      const nameLbl = new PIXI.Text(world.name.toUpperCase(), {
        fontFamily: 'Georgia,serif', fontSize: 8,
        fill: 0xffffff, letterSpacing: 3,
      });
      nameLbl.anchor.set(0.5, 0);
      nameLbl.y = sp.baseR + 24;
      nameLbl.alpha = locked ? 0.08 : 0.3;
      sp.container.addChild(nameLbl);

      // Hit
      const hit = new PIXI.Graphics();
      hit.beginFill(0xffffff, 0.001);
      hit.drawCircle(0, 0, sp.baseR + 22);
      hit.endFill();
      hit.interactive = true;
      hit.cursor = locked ? 'default' : 'pointer';
      hit.on('pointerover', () => { if (!locked) sp.hovered = true; });
      hit.on('pointerout',  () => { sp.hovered = false; });
      hit.on('pointertap',  () => {
        if (locked) return;
        // Diğerlerini kapat
        this._spheres.forEach(s => {
          if (s !== sp && s.isOpen) { s.isOpen = false; s.targetOpenT = 0; }
        });
        // Aç, animasyon bitince otomatik geçiş
        sp.isOpen = true; sp.targetOpenT = 1;
        setTimeout(() => {
          if (this._onSelect) this._onSelect(i);
        }, TEST_MODE ? 600 : 1000); // test modunda daha hızlı
      });
      sp.container.addChild(hit);

      this._world.addChild(sp.container);
      this._spheres.push(sp);
    }
  }

  // Tamamlanmış level noktalarını checkpoint çevresine çiz
  _drawLevelDots() {
    const progress   = getProgress();
    const doneLevel  = progress.completedLevel || 0; // tamamlanan son level
    const doneCPs    = Math.floor(doneLevel / LEVELS_PER_CP);

    for (let ci = 0; ci < Math.min(doneCPs + 1, TOTAL_CHECKPOINTS); ci++) {
      const sp     = this._spheres[ci];
      const world  = getWorldConfig(ci);
      const pos    = this._cpPos(ci);
      // Bu checkpoint'teki kaç level tamamlandı
      const cpStart   = ci * LEVELS_PER_CP + 1;
      const cpEnd     = (ci + 1) * LEVELS_PER_CP;
      const doneLvls  = ci < doneCPs
        ? LEVELS_PER_CP
        : Math.max(0, doneLevel - ci * LEVELS_PER_CP);

      if (doneLvls === 0) continue;

      const R      = sp.baseR;
      const orbitR = R * 1.65; // checkpoint dairesinin dışında
      const gfx    = new PIXI.Graphics();
      gfx.x = pos.x;
      gfx.y = pos.y;

      for (let li = 0; li < LEVELS_PER_CP; li++) {
        const angle  = (li / LEVELS_PER_CP) * Math.PI * 2 - Math.PI / 2;
        const dx     = Math.cos(angle) * orbitR;
        const dy     = Math.sin(angle) * orbitR;
        const filled = li < doneLvls;
        const col    = filled
          ? hexToInt(world.palette[li % world.palette.length])
          : 0x333333;
        const dotR   = filled ? 5 : 3;
        gfx.beginFill(col, filled ? 0.9 : 0.35);
        gfx.drawCircle(dx, dy, dotR);
        gfx.endFill();
      }

      this._world.addChild(gfx);
      sp._levelDots = gfx; // sonradan update için sakla
    }
  }

  // ── Sphere çizim ──────────────────────────────────────────────────
  _drawSphere(sp, dt) {
    sp.openT += (sp.targetOpenT - sp.openT) * 0.08;
    sp.pulseT += dt * 0.02;
    const pulse = Math.sin(sp.pulseT) * 0.5 + 0.5;
    const g = sp.gfx;
    g.clear();

    // 8 halka: palette 7 renk + 1 açık ton (en dış)
    const pal = sp.world.palette;
    const colors = [...pal, this._lighten(pal[0])]; // 8. halka: iç rengin açık tonu
    const R = sp.baseR;
    const open = sp.openT > 0.01;
    const alpha = sp.locked ? 0.22 : 1.0;

    // Dıştan içe: halka i = colors[i]
    for (let i = 7; i >= 0; i--) {
      const col = hexToInt(colors[i]);
      let outerR, innerR;

      if (open) {
        // Her halka radyal olarak dağılır
        const delay = i * 0.07;
        const t = this._easeOutBack(Math.max(0, Math.min(1, (sp.openT - delay) / (1 - delay * 0.5))));
        const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
        const spread = R * 1.6 * t;
        const rx = Math.cos(angle) * spread;
        const ry = Math.sin(angle) * spread;
        const rr = R / 7 * (1.2 + 0.8 * t);

        g.beginFill(col, alpha * (0.7 + 0.3 * t));
        g.drawCircle(rx, ry, rr);
        g.endFill();

        // Kapalı izi (soluklaşır)
        const fadeAlpha = alpha * (1 - t) * 0.6;
        if (fadeAlpha > 0.02) {
          outerR = R * ((i + 1) / 8);
          innerR = R * (i / 8);
          g.beginFill(col, fadeAlpha);
          g.drawCircle(0, 0, outerR);
          g.endFill();
          if (i > 0 && innerR > 0.5) {
            g.beginFill(hexToInt(colors[i - 1]), fadeAlpha);
            g.drawCircle(0, 0, innerR);
            g.endFill();
          }
        }
      } else {
        // Kapalı: iç içe
        outerR = R * ((i + 1) / 8);
        innerR = R * (i / 8);
        g.beginFill(col, alpha);
        g.drawCircle(0, 0, outerR);
        g.endFill();
        if (i > 0 && innerR > 0.5) {
          g.beginFill(hexToInt(colors[i - 1]), alpha);
          g.drawCircle(0, 0, innerR);
          g.endFill();
        }
      }
    }

    // Efektler
    if (sp.locked) {
      g.lineStyle(1.5, 0xffffff, 0.18);
      g.drawCircle(0, 0, R + 4);
      g.lineStyle(0);
    }
    if (sp.active && !open) {
      g.lineStyle(2, hexToInt(colors[4]), 0.35 + 0.3 * pulse);
      g.drawCircle(0, 0, R + 5 + pulse * 8);
      g.lineStyle(0);
    }
    if (sp.done && !open) {
      g.lineStyle(2, 0xFFD700, 0.45 + 0.2 * pulse);
      g.drawCircle(0, 0, R * 1.18);
      g.lineStyle(0);
    }
    if (open && sp.openT > 0.6) {
      const gA = (sp.openT - 0.6) / 0.4 * 0.35;
      g.lineStyle(2, hexToInt(colors[5]), gA);
      g.drawCircle(0, 0, R * 2.2 + pulse * 8);
      g.lineStyle(0);
    }

    const sc = sp.hovered ? 1.1 : sp.active ? (1.02 + pulse * 0.03) : 1;
    sp.container.scale.set(sc);
  }

  // ── Tick ──────────────────────────────────────────────────────────
  _tick(dt) {
    // Scroll
    this._scrollY += (this._targetY - this._scrollY) * 0.1;
    this._world.y = -this._scrollY;

    // Arka plan
    const H = this._app.screen.height;
    const t = (this._scrollY + H / 2) / this._worldH;
    const ci = Math.max(0, Math.min(TOTAL_CHECKPOINTS - 1, Math.round(t * (TOTAL_CHECKPOINTS - 1))));
    const tgt = hexToRGB(getWorldConfig(ci).bgColor);
    this._bgRGB.r += (tgt.r - this._bgRGB.r) * 0.04;
    this._bgRGB.g += (tgt.g - this._bgRGB.g) * 0.04;
    this._bgRGB.b += (tgt.b - this._bgRGB.b) * 0.04;
    this._app.renderer.background.color =
      (Math.round(this._bgRGB.r) << 16) |
      (Math.round(this._bgRGB.g) << 8)  |
       Math.round(this._bgRGB.b);

    // Sphere'ler
    for (const sp of this._spheres) this._drawSphere(sp, dt);

    // Yağmur
    if (this._rainOn) this._updateRain();
  }

  // ── Scroll ────────────────────────────────────────────────────────
  _scrollToActive() {
    const p = getProgress();
    const done = Math.floor((p.completedLevel || 0) / LEVELS_PER_CP);
    const ci = Math.min(done, TOTAL_CHECKPOINTS - 1);
    const pos = this._cpPos(ci);
    const H = this._app.screen.height;
    this._targetY = Math.max(0, Math.min(this._worldH - H, pos.y - H / 2));
    this._scrollY = this._targetY;
  }

  _bindScroll() {
    const el = this._div;
    el.addEventListener('wheel', (e) => {
      this._targetY = Math.max(0, Math.min(
        this._worldH - this._app.screen.height,
        this._targetY + e.deltaY * 0.8
      ));
    });
    let ty = 0;
    el.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove',  (e) => {
      const dy = ty - e.touches[0].clientY;
      ty = e.touches[0].clientY;
      this._targetY = Math.max(0, Math.min(
        this._worldH - this._app.screen.height,
        this._targetY + dy * 1.2
      ));
    }, { passive: true });
  }

  // ── Yağmur ────────────────────────────────────────────────────────
  _updateRain() {
    const W = this._app.screen.width, H = this._app.screen.height;
    if (Math.random() < 0.3) {
      const col = hexToInt(this._rainCols[Math.floor(Math.random() * this._rainCols.length)]);
      const r = 6 + Math.random() * 12;
      const gfx = new PIXI.Graphics();
      gfx.beginFill(col, 0.85); gfx.drawCircle(0, 0, r); gfx.endFill();
      gfx.beginFill(0xffffff, 0.3); gfx.drawCircle(-r * 0.3, -r * 0.3, r * 0.35); gfx.endFill();
      gfx.x = Math.random() * W; gfx.y = -r * 2;
      this._rain.push({ gfx, vy: 2 + Math.random() * 4, vx: (Math.random() - 0.5) * 1.5 });
      this._rainLayer.addChild(gfx);
    }
    for (let i = this._rain.length - 1; i >= 0; i--) {
      const p = this._rain[i];
      p.gfx.x += p.vx; p.gfx.y += p.vy;
      if (p.gfx.y > H + 20) {
        this._rainLayer.removeChild(p.gfx);
        this._rain.splice(i, 1);
      }
    }
  }

  // ── Butonlar ──────────────────────────────────────────────────────
  _showStartBtn(cpIdx) {
    this._hideStartBtn();
    const { lo, hi } = cpLevelRange(cpIdx);
    const btn = document.createElement('button');
    btn.textContent = cpIdx === 0 ? 'Başla ▶' : `Level ${lo}–${hi} ▶`;
    btn.style.cssText = `
      position:fixed; bottom:48px; left:50%; transform:translateX(-50%);
      z-index:200; padding:14px 44px;
      background:linear-gradient(135deg,#00E676,#00C853);
      color:#000; font-size:17px; font-weight:bold;
      font-family:Georgia,serif; letter-spacing:2px;
      border:none; border-radius:50px; cursor:pointer;
      box-shadow:0 0 28px rgba(0,230,118,0.5);
      opacity:0; transition:opacity 0.3s;
    `;
    document.body.appendChild(btn);
    this._startBtn = btn;
    requestAnimationFrame(() => { btn.style.opacity = '1'; });
    btn.addEventListener('click', () => {
      this._hideStartBtn();
      if (this._onSelect) this._onSelect(cpIdx);
    });
  }

  _hideStartBtn() {
    if (this._startBtn) { this._startBtn.remove(); this._startBtn = null; }
  }

  _showContBtn(onDone) {
    if (this._contBtn) { this._contBtn.remove(); }
    const btn = document.createElement('button');
    btn.textContent = 'Devam ▶';
    btn.style.cssText = `
      position:fixed; bottom:48px; left:50%; transform:translateX(-50%);
      z-index:200; padding:16px 48px;
      background:linear-gradient(135deg,#FFD700,#FF9500);
      color:#000; font-size:18px; font-weight:bold;
      font-family:Georgia,serif; letter-spacing:2px;
      border:none; border-radius:50px; cursor:pointer;
      box-shadow:0 0 32px rgba(255,210,0,0.5);
      opacity:0; transition:opacity 0.4s;
    `;
    document.body.appendChild(btn);
    this._contBtn = btn;
    requestAnimationFrame(() => { btn.style.opacity = '1'; });
    btn.addEventListener('click', () => {
      this._rainOn = false;
      this._rain.forEach(p => this._rainLayer.removeChild(p.gfx));
      this._rain = [];
      btn.remove(); this._contBtn = null;
      this.hide();
      if (onDone) onDone();
    });
  }

  // ── Easing ────────────────────────────────────────────────────────
  _lighten(hex) {
    // Hex rengi %50 beyaza yaklaştır
    const n = hexToInt(hex);
    const r = Math.min(255, ((n >> 16) & 255) + 80);
    const g = Math.min(255, ((n >> 8)  & 255) + 80);
    const b = Math.min(255, ( n        & 255) + 80);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  }

  _easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1;
    t = Math.min(Math.max(t, 0), 1);
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
