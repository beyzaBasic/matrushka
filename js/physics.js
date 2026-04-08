// ── physics.js ────────────────────────────────────────────────────
import { state } from './state.js';
import { SHAPE_DEFS } from './constants.js';

export class PhysicsManager {

  // Her şekil için renderer koordinatlarından alınan compound circles
  // [{ox, oy, or}] — c.x/c.y'ye göre offset, hepsi c.r çarpanı
  _circles(c) {
    const r = c.r;
    const shape = c.shape || state.LEVELS[c.level]?.shape || 'sphere';
    // Tek bounding circle — compound yerine stabil ve titremesiz
    switch (shape) {
      case 'jellybear':
      case 'bear':      return [{ x: c.x,          y: c.y + r*0.05, r: r*0.90 }];
      case 'matrushka': return [{ x: c.x,          y: c.y + r*0.05, r: r*0.82 }];
      case 'duck':      return [{ x: c.x + r*0.10, y: c.y - r*0.10, r: r*0.88 }];
      case 'fish':      return [{ x: c.x - r*0.10, y: c.y,          r: r*0.88 }];
      default:          return [{ x: c.x,          y: c.y,          r: r      }];
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

  // Container parametrelerini hesapla — her _clampToU çağrısında cache'lenir
  _containerParams() {
    const { CY, MAIN_R, W } = state;
    const form = state.containerForm || {};
    const openAngle = Math.PI * (form.openFrac ?? 0.50);
    const topWidthFactor = form.topWidthFactor ?? 1.00;
    const arcStartAngle = -Math.PI / 2 + openAngle;
    const juncHW = MAIN_R * Math.cos(arcStartAngle);
    const juncY  = CY + MAIN_R * Math.sin(arcStartAngle);
    const topY   = CY - MAIN_R;
    const wallH  = Math.max(1, juncY - topY);
    // Kap ağzı 8px marjla sınırlı — taşmayı önle
    const maxHW  = W / 2 - 8;
    const topHW  = Math.min(juncHW * topWidthFactor, maxHW);
    const clampedTopWidthFactor = topHW / Math.max(juncHW, 0.001);
    return { juncHW, juncY, topY, wallH, topWidthFactor: clampedTopWidthFactor };
  }

  // Belirli y'de efektif duvar yarı-genişliği
  _wallHW(y, params) {
    const { juncHW, juncY, wallH, topWidthFactor } = params;
    if (y >= juncY) return juncHW; // yay bölgesi — duvar gerekmez, sadece referans
    const t = Math.max(0, Math.min(1, (juncY - y) / wallH)); // 0=junction, 1=top
    return juncHW * (1 + (topWidthFactor - 1) * t);
  }

  // Kap sınırı — container form'a göre genelleştirilmiş, her yerden çağrılır
  _clampToU(c) {
    const { CX, CY, MAIN_R } = state;
    const BOUNCE = 0.55;
    // Shape'e göre efektif yarıçap — gömülmeyi önler
    const cols = this._circles(c);
    const er = cols.reduce((max, cc) => {
      const dist = Math.hypot(cc.x - c.x, cc.y - c.y) + cc.r;
      return Math.max(max, dist);
    }, c.r);

    const cp = this._containerParams();
    const { juncY, topY } = cp;

    if (c.y >= juncY) {
      // ── Yay bölgesi (alt): dairesel sınır ──────────────────────
      const dx = c.x - CX, dy = c.y - CY;
      const d = Math.hypot(dx, dy) || 0.01;
      if (d + er > MAIN_R) {
        const nx = dx / d, ny = dy / d;
        c.x = CX + nx * (MAIN_R - er);
        c.y = CY + ny * (MAIN_R - er);
        const dot = c.vx * nx + c.vy * ny;
        if (dot > 0) {
          c.vx -= (1 + BOUNCE) * dot * nx;
          c.vy -= (1 + BOUNCE) * dot * ny;
          c.squish = { t: 1.0, amt: Math.min(dot * 0.05, 0.30), ax: nx, ay: ny };
        }
      }
    } else {
      // ── Duvar bölgesi (üst): y pozisyonuna göre efektif genişlik ──
      const hw = this._wallHW(c.y, cp);
      // Sol duvar
      if (c.x - er < CX - hw) {
        c.x = CX - hw + er;
        if (c.vx < 0) c.vx = Math.abs(c.vx) * BOUNCE;
      }
      // Sağ duvar
      if (c.x + er > CX + hw) {
        c.x = CX + hw - er;
        if (c.vx > 0) c.vx = -Math.abs(c.vx) * BOUNCE;
      }
      // Üst sınır
      if (c.y - er < topY) {
        c.y = topY + er;
        if (c.vy < 0) c.vy = Math.abs(c.vy) * BOUNCE;
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
    const RESTITUTION = 0.20, WALL_BOUNCE = 0.25;
    const ITERS = 3; // yığılma çözümü için
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
            // kütle bazlı position correction — büyük top az kayar
            const m1 = c1.r * c1.r, m2 = c2.r * c2.r, mt = m1 + m2;
            c1.x -= nx * ov * (m2 / mt); c1.y -= ny * ov * (m2 / mt);
            c2.x += nx * ov * (m1 / mt); c2.y += ny * ov * (m1 / mt);
            // velocity response sadece ilk iter — bounce birikmez
            if (iter === 0) {
              const dvn = (c1.vx - c2.vx) * nx + (c1.vy - c2.vy) * ny;
              if (dvn > 0) {
                const imp = (1 + RESTITUTION) * dvn / mt;
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
      // her iter sonunda wall clamp — container form'a göre, sonraki iter tutarlı başlar
      const cp2 = this._containerParams();
      for (const c of circles) {
        if (c.isBeingDragged) continue;
        const er = this._circles(c)[0].r;
        const dx = c.x - CX, dy2 = c.y - CY;
        if (c.y >= cp2.juncY) {
          // Yay bölgesi — dairesel sınır
          const d = Math.hypot(dx, dy2) || 0.01;
          if (d + er > MAIN_R) {
            const nx = dx / d, ny = dy2 / d;
            c.x = CX + nx * (MAIN_R - er);
            c.y = CY + ny * (MAIN_R - er);
            const dot = c.vx * nx + c.vy * ny;
            if (dot > 0) {
              c.vx -= (1 + WALL_BOUNCE) * dot * nx;
              c.vy -= (1 + WALL_BOUNCE) * dot * ny;
              c.squish = { t: 1.0, amt: Math.min(dot * 0.05, 0.30), ax: nx, ay: ny };
            }
          }
        } else {
          // Duvar bölgesi — container form genişliğine göre
          const hw = this._wallHW(c.y, cp2);
          if (c.x - er < CX - hw) {
            c.x = CX - hw + er;
            if (c.vx < 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: -1, ay: 0 };
          }
          if (c.x + er > CX + hw) {
            c.x = CX + hw - er;
            if (c.vx > 0) { c.vx = -c.vx * WALL_BOUNCE; }
            c.squish = { t: 1.0, amt: 0.2, ax: 1, ay: 0 };
          }
          const topLimit = cp2.topY;
          if (c.y - er < topLimit) {
            c.y = topLimit + er;
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
      c.vy += (state.gravity ?? 0.35) * S; c.x += c.vx; c.y += c.vy; c.vx *= 0.992; c.vy *= 0.985;
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
    for (let i = 0; i < n; i++) { circles[i].absorbGlow = 0; circles[i].absorbNear = false; circles[i].mergeNear = false; }
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
