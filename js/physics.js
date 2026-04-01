// ── physics.js ────────────────────────────────────────────────────
import { state } from './state.js';
import { SHAPE_DEFS } from './constants.js';

export class PhysicsManager {

  // Her şekil için renderer koordinatlarından alınan compound circles
  // [{ox, oy, or}] — c.x/c.y'ye göre offset, hepsi c.r çarpanı
  _circles(c) {
    const r = c.r;
    const shape = c.shape || state.LEVELS[c.level]?.shape || 'sphere';
    switch (shape) {
      case 'bear': {
        const d = SHAPE_DEFS.bear;
        return [
          { x: c.x, y: c.y + r * d.body.oy, r: r * d.body.r },
          { x: c.x, y: c.y + r * d.head.oy, r: r * d.head.r },
        ];
      }
      case 'matrushka': {
        const d = SHAPE_DEFS.matrushka;
        return [
          { x: c.x, y: c.y + r * d.body.oy, r: r * d.body.rw },
          { x: c.x, y: c.y + r * d.head.oy, r: r * d.head.r  },
        ];
      }
      case 'duck': {
        const d = SHAPE_DEFS.duck;
        return [
          { x: c.x,                 y: c.y + r * d.body.oy, r: r * d.body.rw },
          { x: c.x + r * d.head.ox, y: c.y + r * d.head.oy, r: r * d.head.r  },
          { x: c.x + r * d.beak.ox, y: c.y + r * d.beak.oy, r: r * d.beak.r  },
        ];
      }
      case 'fish': {
        const d = SHAPE_DEFS.fish;
        return [
          { x: c.x + r * d.body.ox, y: c.y, r: r * d.body.rw },
          { x: c.x + r * d.tail.ox, y: c.y, r: r * d.tail.r  },
        ];
      }
      default:
        return [{ x: c.x, y: c.y, r }];
    }
  }

  // İki nesne arasındaki en derin compound çakışma
  // Döner: { ov (>0 = çakışma), nx, ny } — itme yönü c1→c2
  _overlap(c1, c2) {
    const circles1 = this._circles(c1);
    const circles2 = this._circles(c2);
    let bestOv = -Infinity, bestNx = 0, bestNy = 1;
    for (const a of circles1) {
      for (const b of circles2) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy) || 0.001;
        const ov = (a.r + b.r) - d;
        if (ov > bestOv) {
          bestOv = ov;
          bestNx = dx / d;
          bestNy = dy / d;
        }
      }
    }
    return { ov: bestOv, nx: bestNx, ny: bestNy };
  }

  // U sınırı — kesin clamp, her yerden çağrılır
  _clampToU(c) {
    const { CX, CY, MAIN_R } = state;
    const BOUNCE = 0.55;
    // X: duvarlar arası her zaman
    c.x = Math.max(CX - MAIN_R + c.r, Math.min(CX + MAIN_R - c.r, c.x));
    // Y üst sınır — bounce
    if (c.y - c.r < CY - MAIN_R) {
      c.y = CY - MAIN_R + c.r;
      if (c.vy < 0) { c.vy = Math.abs(c.vy) * BOUNCE; }
    }
    // Alt yarım daire — bounce + squish
    const dx = c.x - CX, dy = c.y - CY;
    if (dy >= 0) {
      const d = Math.hypot(dx, dy) || 0.01;
      if (d + c.r > MAIN_R) {
        const nx = dx/d, ny = dy/d;
        c.x = CX + nx * (MAIN_R - c.r);
        c.y = CY + ny * (MAIN_R - c.r);
        const dot = c.vx*nx + c.vy*ny;
        if (dot > 0) {
          c.vx -= (1 + BOUNCE) * dot * nx;
          c.vy -= (1 + BOUNCE) * dot * ny;
          c.squish = { t: 1.0, amt: Math.min(dot * 0.05, 0.30), ax: nx, ay: ny };
        }
      }
    }
  }

  canAbsorb(big, small) {
    if (big === small) return false;
    if (big.level <= small.level) return false;
    if (big.contains.length > 0) return false;
    if (small.level !== big.level - 1) return false;
    return true;
  }

  sceneHasAbsorbPending() {
    const c = state.circles;
    for (let i = 0; i < c.length; i++)
      for (let j = 0; j < c.length; j++)
        if (i !== j && this.canAbsorb(c[i], c[j])) return true;
    return false;
  }

  sceneHasMergePending() {
    const { circles, LEVELS } = state;
    for (let lv = 0; lv < LEVELS.length - 1; lv++)
      if (circles.filter(c => c.level === lv && c.contains.length === 0).length >= 2) return true;
    return false;
  }

  sceneHasActionPending() {
    return this.sceneHasAbsorbPending() || this.sceneHasMergePending();
  }

  solveCollisions() {
    const { circles, CX, CY, MAIN_R } = state;
    const n = circles.length;
    if (n === 0) return;
    const RESTITUTION = 0.75, WALL_BOUNCE = 0.45;
    // Mobilde 5 iterasyon yeterli — 8 gereksiz yük
    const ITERS = n <= 4 ? 3 : n <= 8 ? 2 : 2;
    for (let iter = 0; iter < ITERS; iter++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const c1 = circles[i], c2 = circles[j];
          if (c1.isBeingDragged || c2.isBeingDragged) {
            const dragged = c1.isBeingDragged ? c1 : c2, other = c1.isBeingDragged ? c2 : c1;
            const canAbs  = this.canAbsorb(dragged, other) || this.canAbsorb(other, dragged);
            if (canAbs) {
              // Zaten başka bir çift kilitliyse bu çifti işleme
              if (dragged._absorbTarget && dragged._absorbTarget !== other.id) {
                continue;
              }
              const dx   = other.x - dragged.x, dy = other.y - dragged.y;
              const dist = Math.hypot(dx, dy) || 0.01;
              const attractDist = (dragged.r + other.r) * 1.8;
              if (dist < attractDist) {
                // İlk çifti kilitle
                dragged._absorbTarget = other.id;
                dragged.absorbNear = true;
                other.absorbNear   = true;
                // Çekme kuvveti
                const strength = (1 - dist / attractDist) * 1.2;
                const nx2 = dx / dist, ny2 = dy / dist;
                other.vx -= nx2 * strength;
                other.vy -= ny2 * strength;
                // Yeterince overlap olduysa — absorb flag set et
                const { ov: absOv } = this._overlap(dragged, other);
                if (absOv > dragged.r * 0.3) {
                  dragged._shouldAbsorb = other.id;
                }
              } else {
                if (dragged._absorbTarget === other.id) dragged._absorbTarget = null;
                dragged.absorbNear = false;
                other.absorbNear   = false;
              }
              continue;
            }
            // Normal çift — tam it
            const { ov, nx, ny } = this._overlap(dragged, other);
            if (ov > 0) { other.x += nx * ov; other.y += ny * ov; }
            continue;
          }
          // absorb çiftleri artık normal collision'a tabi — yanyana dururlar, drag ile absorb
          // broad-phase
          const bdx = c2.x - c1.x, bdy = c2.y - c1.y;
          if (Math.abs(bdx) > c1.r + c2.r || Math.abs(bdy) > c1.r + c2.r) continue;
          const { ov, nx, ny } = this._overlap(c1, c2);
          if (ov > 0) {
            const half = ov * 0.5;
            c1.x -= nx * half; c1.y -= ny * half;
            c2.x += nx * half; c2.y += ny * half;
            const m1 = c1.r * c1.r, m2 = c2.r * c2.r;
            const dvn = (c1.vx - c2.vx) * nx + (c1.vy - c2.vy) * ny;
            if (dvn > 0) {
              const imp = (1 + RESTITUTION) * dvn / (m1 + m2);
              c1.vx -= imp * m2 * nx; c1.vy -= imp * m2 * ny;
              c2.vx += imp * m1 * nx; c2.vy += imp * m1 * ny;
              const strength = Math.min(dvn * 0.06, 0.38);
              c1.squish = { t: 1.0, amt: strength, ax: -nx, ay: -ny };
              c2.squish = { t: 1.0, amt: strength, ax: nx, ay: ny };
            }
          }
        }
      }
      for (const c of circles) {
        if (c.isBeingDragged) continue;
        const dx = c.x - CX, dy = c.y - CY;
        if (dy >= 0) {
          const d = Math.hypot(dx, dy) || 0.01;
          if (d + c.r > MAIN_R) {
            const nx = dx / d, ny = dy / d;
            c.x = CX + nx * (MAIN_R - c.r);
            c.y = CY + ny * (MAIN_R - c.r);
            const dot = c.vx * nx + c.vy * ny;
            if (dot > 0) {
              c.vx -= (1 + WALL_BOUNCE) * dot * nx;
              c.vy -= (1 + WALL_BOUNCE) * dot * ny;
              c.squish = { t: 1.0, amt: Math.min(dot * 0.05, 0.30), ax: nx, ay: ny };
            }
          }
        } else {
          if (c.x - c.r < CX - MAIN_R) {
            c.x = CX - MAIN_R + c.r;
            if (c.vx < 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: -1, ay: 0 };
          }
          if (c.x + c.r > CX + MAIN_R) {
            c.x = CX + MAIN_R - c.r;
            if (c.vx > 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: 1, ay: 0 };
          }
          const topLimit = state.CY - state.MAIN_R;
          if (c.y - c.r < topLimit) {
            c.y = topLimit + c.r;
            if (c.vy < 0) c.vy = Math.abs(c.vy) * 0.3;
          }
        }
      }
    }
    // Son clamp
    for (const c of state.circles) this._clampToU(c);
  }

  updateCirclePhysics() {
    const { circles, mousePos, CX, CY, MAIN_R, S } = state;
    for (const c of circles) {
      if (c.absorbAnim > 0) c.absorbAnim--;
      if (c.boing > 0) c.boing = Math.max(0, c.boing - 0.05);
      if (c.isBeingDragged) {
        // mousePos zaten _onMove'da clamp edildi — _clampToU ile garantile
        c.x = mousePos.x;
        c.y = mousePos.y;
        this._clampToU(c);
        continue;
      }
      c.vy += 0.35 * S; c.x += c.vx; c.y += c.vy; c.vx *= 0.992; c.vy *= 0.985;
      this._clampToU(c);
      if (c.squish && c.squish.t > 0) c.squish.t = Math.max(0, c.squish.t - 0.09);
      c.absorbGlow = 0;
    }
  }

  updateAbsorbGlow() {
    const { circles } = state;
    const n = circles.length;
    // Her 3 framede bir güncelle — görsel fark yok, %66 tasarruf
    if ((state.frameCount || 0) % 3 !== 0) return;
    for (let i = 0; i < n; i++) { circles[i].absorbGlow = 0; circles[i].absorbNear = false; }
    for (let i = 0; i < n; i++) {
      const a = circles[i];
      for (let j = i + 1; j < n; j++) {
        const b = circles[j];
        // Seviye farkı yoksa absorb olamaz — erken çık
        if (a.level === b.level) continue;
        const big = a.level > b.level ? a : b, small = a.level > b.level ? b : a;
        if (big.contains.length > 0) continue;
        if (small.level !== big.level - 1) continue;
        const triggerDist = (big.r + small.r) * 2.0;
        const adx = big.x - small.x, ady = big.y - small.y;
        if (Math.abs(adx) > triggerDist || Math.abs(ady) > triggerDist) continue;
        const { ov: agOv } = this._overlap(big, small);
        const proximity = agOv > 0 ? 1.0 : Math.max(0, 1 - Math.hypot(adx, ady) / triggerDist);
        if (proximity > 0) {
          small.absorbGlow = Math.max(small.absorbGlow, proximity);
        }
      }
    }
  }

  applyWorldRotation() {
    const { CX, CY, circles } = state;
    let { rotVel, worldRot } = state;
    rotVel = Math.max(-0.08, Math.min(0.08, rotVel));
    const cos = Math.cos(rotVel), sin = Math.sin(rotVel);
    for (const c of circles) {
      if (c.isBeingDragged) continue;
      const dx = c.x - CX, dy = c.y - CY;
      c.x = CX + dx * cos - dy * sin; c.y = CY + dx * sin + dy * cos;
      const vx = c.vx, vy = c.vy;
      c.vx = vx * cos - vy * sin; c.vy = vx * sin + vy * cos;
    }
    state.worldRot = worldRot + rotVel;
    state.rotVel = rotVel * 0.90;
    if (Math.abs(state.rotVel) < 0.0001) state.rotVel = 0;
  }
}
