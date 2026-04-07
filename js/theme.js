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
    state.LEVELS = buildLevels(state.MAIN_R, palette, cfg.shape || 'sphere');

    // Kap formu ve yerçekimi — physics._clampToU + game._draw okur
    state.containerForm = cfg.containerForm || { openFrac: 0.50, topWidthFactor: 1.00 };
    state.gravity       = cfg.gravity ?? 0.35;

    // state.theme: tüm çizim kodlarının okuyacağı tek kaynak
    state.theme = {
      cpIdx,
      name:      cfg.name,
      bgColor:   cfg.bgColor,
      palette,
      arenaBase: palette[6],
      accentMid: palette[3],
      accentLo:  palette[1],
      // Arka plan gradient — bgColor'dan palette aksanlarıyla türetilir
      shape:  cfg.shape || 'sphere',
      bgTop: cfg.bgTop || cfg.bgColor,
      bgMid: cfg.bgMid || _blend(cfg.bgColor, palette[2], 0.18),
      bgBot: cfg.bgBot || _blend(cfg.bgColor, palette[4], 0.12),
      containerForm: state.containerForm,
      gravity:       state.gravity,
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
    if (state.theme && state.theme.cpIdx === cpIdx) {
      // Aynı CP — LEVELS'ı yenile ve blast renklerini de güncelle
      state.LEVELS = buildLevels(state.MAIN_R, state.theme.palette, state.theme.shape || 'sphere');
      for (const btn of state.BLAST_BTNS) {
        const lv = btn.levels[0];
        if (lv < state.LEVELS.length) btn.color = state.LEVELS[lv].color;
      }
      return;
    }
    this.apply(cpIdx);
  }

  // Resize sonrası LEVELS'ı ve renkleri yenile (CP değişmez)
  reapplyAfterResize() {
    if (!state.theme) return;
    state.LEVELS = buildLevels(state.MAIN_R, state.theme.palette, state.theme.shape || 'sphere');
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
