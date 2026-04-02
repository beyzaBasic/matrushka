// ── physics.js ────────────────────────────────────────────────────
import { state } from './state.js';
import { SHAPE_DEFS } from './constants.js';

export class PhysicsManager {

  // Collision circle — gövde bazlı, stabil, titremesiz
  _circles(c) {
    const r = c.r;
    const shape = c.shape || state.LEVELS[c.level]?.shape || 'sphere';
    switch (shape) {
      case 'jellybear':
      case 'bear':      return [{ x: c.x,          y: c.y,          r: r * 0.90 }];
      case 'matrushka': return [{ x: c.x,          y: c.y + r*0.18, r: r * 0.72 }];
      case 'duck':      return [{ x: c.x,          y: c.y + r*0.08, r: r * 0.82 }];
      case 'fish':      return [{ x: c.x + r*0.05, y: c.y,          r: r * 0.90 }];
      default:          return [{ x: c.x,          y: c.y,          r: r        }];
    }
  }

  // Collision efektif yarıçap
  _er(c) {
    const cols = this._circles(c);
    return cols.reduce((max, cc) => {
      return Math.max(max, Math.hypot(cc.x - c.x, cc.y - c.y) + cc.r);
    }, 0);
  }

  // Görsel bounding radius — SHAPE_DEFS tüm parçalardan hesaplandı
  // jellybear: kulak(0.92)+ayak(0.92)+kol(0.92) → 1.00r
  // matrushka: gövde_alt(0.96)+kafa_üst(0.76) → 0.96r
  // duck:      gövde_alt(0.80)+kafa_üst(0.84)+kafa_sağ(0.74) → 0.94r  [beak ince çıkıntı, hariç]
  // fish:      kuyruk_sol(1.10)+yan_yüzgeç(0.90) → 1.10r              [üst_yüzgeç ince, hariç]
  _visualEr(c) {
    const r = c.r;
    const shape = c.shape || state.LEVELS[c.level]?.shape || 'sphere';
    switch (shape) {
      case 'jellybear':
      case 'bear':      return r * 1.00;
      case 'matrushka': return r * 0.96;
      case 'duck':      return r * 0.94;
      case 'fish':      return r * 1.10;
      default:          return r;
    }
  }

  // U sınırı — görsel er ile clamp
  _clampToU(c) {
    const { CX, CY, MAIN_R } = state;
    const BOUNCE = 0.55;
    const ver = this._visualEr(c);

    c.x = Math.max(CX - MAIN_R + ver, Math.min(CX + MAIN_R - ver, c.x));
    if (c.y - ver < CY - MAIN_R) {
      c.y = CY - MAIN_R + ver;
      if (c.vy < 0) { c.vy = Math.abs(c.vy) * BOUNCE; }
    }
    const dx = c.x - CX, dy = c.y - CY;
    if (dy >= 0) {
      const d = Math.hypot(dx, dy) || 0.01;
      if (d + ver > MAIN_R) {
        const nx = dx/d, ny = dy/d;
        c.x = CX + nx * (MAIN_R - ver);
        c.y = CY + ny * (MAIN_R - ver);
        const dot = c.vx*nx + c.vy*ny;
        if (dot > 0) {
          c.vx -= (1 + BOUNCE) * dot * nx;
          c.vy -= (1 + BOUNCE) * dot * ny;
          c.squish = { t: 1.0, amt: Math.min(dot * 0.05, 0.30), ax: nx, ay: ny };
        }
      }
    } else {
      if (c.x - ver < CX - MAIN_R) {
        c.x = CX - MAIN_R + ver;
        if (c.vx < 0) c.vx = Math.abs(c.vx) * BOUNCE;
      }
      if (c.x + ver > CX + MAIN_R) {
        c.x = CX + MAIN_R - ver;
        if (c.vx > 0) c.vx = -Math.abs(c.vx) * BOUNCE;
      }
    }
  }

  // İki nesne arasındaki çakışma
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
    const RESTITUTION = 0.20, WALL_BOUNCE = 0.25;
    const ITERS = 3;

    for (let iter = 0; iter < ITERS; iter++) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const c1 = circles[i], c2 = circles[j];

          if (c1.isBeingDragged || c2.isBeingDragged) {
            const dragged = c1.isBeingDragged ? c1 : c2, other = c1.isBeingDragged ? c2 : c1;
            const canAbs = this.canAbsorb(dragged, other) || this.canAbsorb(other, dragged);
            if (canAbs) {
              const dx = other.x - dragged.x, dy = other.y - dragged.y;
              const dist = Math.hypot(dx, dy) || 0.01;
              const touchDist = (dragged.r + other.r) * 1.4;
              if (dist < touchDist) {
                dragged.absorbNear = true;
                other.absorbNear   = true;
                const { ov, nx, ny } = this._overlap(dragged, other);
                if (ov > 0) { other.x += nx * ov * 0.1; other.y += ny * ov * 0.1; }
              } else {
                dragged.absorbNear = false;
                other.absorbNear   = false;
                const { ov, nx, ny } = this._overlap(dragged, other);
                if (ov > 0) { other.x += nx * ov; other.y += ny * ov; }
              }
            } else {
              const canMerge = dragged.level === other.level && dragged.contains.length === 0 && other.contains.length === 0;
              const { ov, nx, ny } = this._overlap(dragged, other);
              if (ov > 0) {
                const dx2 = other.x - dragged.x, dy2 = other.y - dragged.y;
                const dist2 = Math.hypot(dx2, dy2) || 0.01;
                const touchDist2 = (dragged.r + other.r) * 1.4;
                if (canMerge && dist2 < touchDist2) {
                  dragged.mergeNear = true;
                  other.mergeNear   = true;
                  other.x += nx * ov * 0.1;
                  other.y += ny * ov * 0.1;
                } else {
                  other.x += nx * ov;
                  other.y += ny * ov;
                }
              }
            }
            continue;
          }

          // broad-phase
          const bdx = c2.x - c1.x, bdy = c2.y - c1.y;
          if (Math.abs(bdx) > c1.r + c2.r || Math.abs(bdy) > c1.r + c2.r) continue;

          const { ov, nx, ny } = this._overlap(c1, c2);
          if (ov > 0) {
            const half = ov * 0.5;
            c1.x -= nx * half; c1.y -= ny * half;
            c2.x += nx * half; c2.y += ny * half;
            if (iter === 0) {
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
      }

      // Her iterasyon sonunda wall clamp — görsel er ile
      for (const c of circles) {
        if (c.isBeingDragged) continue;
        const ver = this._visualEr(c);
        const dx = c.x - CX, dy = c.y - CY;
        if (dy >= 0) {
          const d = Math.hypot(dx, dy) || 0.01;
          if (d + ver > MAIN_R) {
            const nx = dx / d, ny = dy / d;
            c.x = CX + nx * (MAIN_R - ver);
            c.y = CY + ny * (MAIN_R - ver);
            const dot = c.vx * nx + c.vy * ny;
            if (dot > 0) {
              c.vx -= (1 + WALL_BOUNCE) * dot * nx;
              c.vy -= (1 + WALL_BOUNCE) * dot * ny;
              c.squish = { t: 1.0, amt: Math.min(dot * 0.05, 0.30), ax: nx, ay: ny };
            }
          }
        } else {
          if (c.x - ver < CX - MAIN_R) {
            c.x = CX - MAIN_R + ver;
            if (c.vx < 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: -1, ay: 0 };
          }
          if (c.x + ver > CX + MAIN_R) {
            c.x = CX + MAIN_R - ver;
            if (c.vx > 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: 1, ay: 0 };
          }
          const topLimit = state.CY - state.MAIN_R;
          if (c.y - ver < topLimit) {
            c.y = topLimit + ver;
            if (c.vy < 0) c.vy = Math.abs(c.vy) * 0.3;
          }
        }
      }
    }

    // Son kesin clamp
    for (const c of state.circles) this._clampToU(c);
  }

  updateCirclePhysics() {
    const { circles, mousePos, S } = state;
    for (const c of circles) {
      if (c.absorbAnim > 0) c.absorbAnim--;
      if (c.boing > 0) c.boing = Math.max(0, c.boing - 0.05);
      if (c.isBeingDragged) {
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
    if ((state.frameCount || 0) % 3 !== 0) return;
    for (let i = 0; i < n; i++) { circles[i].absorbGlow = 0; circles[i].absorbNear = false; circles[i].mergeNear = false; }
    for (let i = 0; i < n; i++) {
      const a = circles[i];
      for (let j = i + 1; j < n; j++) {
        const b = circles[j];
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
