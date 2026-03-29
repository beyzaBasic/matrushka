// ── physics.js ────────────────────────────────────────────────────
import { state } from './state.js';

export class PhysicsManager {
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
    const RESTITUTION = 0.65, WALL_BOUNCE = 0.35;
    for (let iter = 0; iter < 8; iter++) {
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const c1 = circles[i], c2 = circles[j];
          if (c1.isBeingDragged || c2.isBeingDragged) {
            const dragged = c1.isBeingDragged ? c1 : c2, other = c1.isBeingDragged ? c2 : c1;
            const ddx = other.x - dragged.x, ddy = other.y - dragged.y;
            const dd = Math.hypot(ddx, ddy) || 0.01, mn = dragged.r + other.r;
            if (dd < mn) { const ov = mn - dd; other.x += (ddx / dd) * ov; other.y += (ddy / dd) * ov; }
            continue;
          }
          if (c1.level !== c2.level && (this.canAbsorb(c1, c2) || this.canAbsorb(c2, c1))) continue;
          const dx = c2.x - c1.x, dy = c2.y - c1.y;
          const d = Math.hypot(dx, dy) || 0.01, min = c1.r + c2.r;
          if (d < min) {
            const nx = dx / d, ny = dy / d, ov = (min - d) * 0.5;
            c1.x -= nx * ov; c1.y -= ny * ov; c2.x += nx * ov; c2.y += ny * ov;
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
      // U şekli fizik sınırları:
      // - Alt yarım daire (y >= CY): tam daire sınırı
      // - Üst kısım (y < CY): sadece sol (x < CX-MAIN_R) ve sağ (x > CX+MAIN_R) duvarlar
      for (const c of circles) {
        if (c.isBeingDragged) continue;
        const dx = c.x - CX, dy = c.y - CY;

        if (dy >= 0) { // CY'nin altı: daire sınırı
          // Alt yarım daire sınırı
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
          // Üst kısım — sadece sol ve sağ duvar (x sınırı = MAIN_R)
          // Sol duvar
          if (c.x - c.r < CX - MAIN_R) {
            c.x = CX - MAIN_R + c.r;
            if (c.vx < 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: -1, ay: 0 };
          }
          // Sağ duvar
          if (c.x + c.r > CX + MAIN_R) {
            c.x = CX + MAIN_R - c.r;
            if (c.vx > 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: 1, ay: 0 };
          }
          // Üstten kaçmasın — U'nun üst kenarı sınırı
          const topLimit = state.CY - state.MAIN_R;
          if (c.y - c.r < topLimit) {
            c.y = topLimit + c.r;
            if (c.vy < 0) c.vy = Math.abs(c.vy) * 0.3;
          }
        }
      }
    }
  }

  updateCirclePhysics() {
    const { circles, mousePos, CX, CY, MAIN_R, S } = state;
    for (const c of circles) {
      if (c.absorbAnim > 0) c.absorbAnim--;
      if (c.boing > 0) c.boing = Math.max(0, c.boing - 0.05);
      if (c.isBeingDragged) {
        // U içinde serbestçe taşınabilir, sadece sol/sağ duvar sınırı
        const tx = mousePos.x, ty = mousePos.y;
        c.x = Math.max(CX - MAIN_R + c.r, Math.min(CX + MAIN_R - c.r, tx));
        c.y = Math.max(state.SCORE_AREA + c.r, ty);
        continue;
      }
      c.vy += 0.22 * S; c.x += c.vx; c.y += c.vy; c.vx *= 0.992; c.vy *= 0.985;
      if (c.squish && c.squish.t > 0) c.squish.t = Math.max(0, c.squish.t - 0.09);
      c.absorbGlow = 0;
    }
  }

  updateAbsorbGlow() {
    const { circles } = state;
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i], b = circles[j];
        const big = a.level > b.level ? a : b, small = a.level > b.level ? b : a;
        if (!this.canAbsorb(big, small)) continue;
        const d = Math.hypot(big.x - small.x, big.y - small.y);
        const triggerDist = (big.r + small.r) * 2.2;
        if (d < triggerDist) {
          const intensity = 1 - (d / triggerDist);
          small.absorbGlow = Math.max(small.absorbGlow || 0, intensity);
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
