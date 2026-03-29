// ── theme.js ──────────────────────────────────────────────────────
// Checkpoint temasını tek yerden yönetir.
// state.theme üzerinden tüm modüllere dağıtır.
// Bağımlı olan: game.js (apply), renderer.js (bg/arena), hints.js (chain)

import { state } from './state.js';
import { getWorldConfig, cpIdxFromLevel } from './world-config.js';
import { buildLevels } from './constants.js';
import { TUTORIAL_LEVELS } from './constants.js';

export class ThemeManager {

  // ── Mevcut CP'ye göre temayı uygula ─────────────────────────────
  apply(cpIdx) {
    const cfg = getWorldConfig(cpIdx);
    const palette = cfg.palette;

    // LEVELS'ı palette renkleriyle yeniden oluştur
    state.LEVELS = buildLevels(state.MAIN_R, palette);

    // state.theme: tüm çizim kodlarının okuyacağı tek kaynak
    state.theme = {
      cpIdx,
      name:    cfg.name,
      bgColor: cfg.bgColor,
      palette,
      // Türetilmiş renkler (tekrar hesaplama gerekmesin)
      arenaBase:  palette[6],          // en büyük top rengi — arena ana rengi
      accentMid:  palette[3],          // orta ton — hint chain, ok
      accentLo:   palette[1],          // düşük ton — ikincil vurgular
      // Arka plan gradient duraksama renkleri (bgColor temel, biraz açık/koyu türetilir)
      bgTop:    cfg.bgColor,
      bgMid:    _blend(cfg.bgColor, palette[5], 0.08),
      bgBot:    _blend(cfg.bgColor, palette[6], 0.05),
    };

    // Sahnedeki mevcut topları ve blast butonlarını da güncelle
    for (const c of state.circles) {
      c.color = state.LEVELS[c.level].color;
    }
    for (const btn of state.BLAST_BTNS) {
      const lv = btn.levels[0];
      if (lv < state.LEVELS.length) btn.color = state.LEVELS[lv].color;
    }
  }

  // Level değişiminde CP değişip değişmediğini kontrol et, değiştiyse uygula
  applyForLevel(internalLevel) {
    const cpIdx = cpIdxFromLevel(internalLevel, TUTORIAL_LEVELS);
    // Zaten aynı CP'deyse tekrar kurma (performans)
    if (state.theme && state.theme.cpIdx === cpIdx) {
      // MAIN_R resize'dan değişmiş olabilir — LEVELS'ı yenile ama theme'i koru
      state.LEVELS = buildLevels(state.MAIN_R, state.theme.palette);
      return;
    }
    this.apply(cpIdx);
  }

  // Resize sonrası LEVELS'ı ve renkleri yenile (CP değişmez)
  reapplyAfterResize() {
    if (!state.theme) return;
    state.LEVELS = buildLevels(state.MAIN_R, state.theme.palette);
    for (const c of state.circles) {
      c.color = state.LEVELS[c.level].color;
    }
    for (const btn of state.BLAST_BTNS) {
      const lv = btn.levels[0];
      if (lv < state.LEVELS.length) btn.color = state.LEVELS[lv].color;
    }
  }

  // Kolaylık: mevcut tema rengi (yoksa fallback)
  get(key, fallback = '#ffffff') {
    return state.theme?.[key] ?? fallback;
  }
}

// ── Yardımcı: iki hex rengi t oranında karıştır ──────────────────
function _blend(hexA, hexB, t) {
  const a = _parse(hexA), b = _parse(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
}

function _parse(hex) {
  const n = parseInt((hex || '#000000').replace('#',''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
