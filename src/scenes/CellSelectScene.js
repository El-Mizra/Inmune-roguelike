import Phaser from 'phaser';
import { t, L } from '../systems/i18n.js';
import { CELLS, CELL_ORDER, isUnlocked } from '../data/cells.js';
import { title, body, button, panel, fadeIn, restartOnResize, floatingBackdrop, drawPanel, COLORS, FONT_TITLE } from '../systems/ui.js';
import { newRun } from './GameScene.js';
import { Save } from '../systems/storage.js';

export class CellSelectScene extends Phaser.Scene {
  constructor() {
    super('CellSelect');
  }

  init(data) {
    this.selected = data?.selected || 'neutrophil';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    fadeIn(this);
    floatingBackdrop(this, 10);
    restartOnResize(this, { selected: this.selected });
    Save.discover('cell_neutrophil');

    title(this, W / 2, 34, t('chooseCell'), 16, COLORS.gold);

    const n = CELL_ORDER.length;
    const cw = Math.min(150, Math.floor((W - 40) / n) - 10);
    const ch = 150;
    const total = n * cw + (n - 1) * 10;
    const x0 = W / 2 - total / 2;
    const cy = 64;
    CELL_ORDER.forEach((id, i) => {
      const c = CELLS[id];
      const x = x0 + i * (cw + 10);
      const sel = id === this.selected;
      const g = this.add.graphics();
      drawPanel(g, x, cy, cw, ch, {
        fill: sel ? 0x5a2236 : COLORS.panel,
        border: sel ? COLORS.accent : isUnlocked(id) ? COLORS.border : COLORS.borderDim,
      });
      const spr = this.add.sprite(x + cw / 2, cy + 58, c.texture, 0).setScale(4);
      if (isUnlocked(id)) spr.play(`${c.texture}_idle`, true);
      else spr.setTint(0x3a2030);
      this.add
        .text(x + cw / 2, cy + 112, L(c.name), {
          fontFamily: '"VT323", monospace',
          fontSize: '22px',
          color: isUnlocked(id) ? COLORS.text : COLORS.textDim,
          align: 'center',
          wordWrap: { width: cw - 8 },
        })
        .setOrigin(0.5, 0);
      if (!isUnlocked(id)) {
        this.add.text(x + cw / 2, cy + 14, t(c.playable ? 'lockedCell' : 'locked'), { fontFamily: FONT_TITLE, fontSize: '8px', color: COLORS.textDim }).setOrigin(0.5);
      }
      const z = this.add.zone(x, cy, cw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerup', () => {
        if (this.selected !== id) this.scene.restart({ selected: id });
      });
    });

    // ficha de la célula seleccionada
    const c = CELLS[this.selected];
    const py = cy + ch + 14;
    const ph = H - py - 74;
    const pw = Math.min(W - 40, 820);
    const px = W / 2 - pw / 2;
    panel(this, px, py, pw, ph, { alpha: 0.9 });
    const branch = c.branch === 'innate' ? t('innate') : t('adaptive');
    body(this, px + 16, py + 10, `${L(c.name)}  ·  ${branch}`, 26, COLORS.gold);
    let ty = py + 40;
    const wrap = { wordWrap: { width: pw - 32 } };
    const sum = body(this, px + 16, ty, L(c.summary), 22, COLORS.text, wrap);
    ty += sum.height + 8;
    if (c.playable) {
      const w1 = body(this, px + 16, ty, `${t('weaponLabel')}: ${L(c.weapon.name)} — ${L(c.weapon.desc)}`, 20, COLORS.pink, wrap);
      ty += w1.height + 4;
      const s1 = body(this, px + 16, ty, `${t('skillLabel')}: ${L(c.skill.name)} — ${L(c.skill.desc)}`, 20, COLORS.blue, wrap);
      ty += s1.height + 8;
      const facts = L(c.facts);
      const fact = facts[Math.floor(Math.random() * facts.length)];
      if (ty + 40 < py + ph && isUnlocked(this.selected)) body(this, px + 16, ty, `${t('realFact')}: ${fact}`, 20, COLORS.textDim, wrap);
    } else {
      body(this, px + 16, ty, t('locked'), 22, COLORS.textDim);
    }
    if (c.playable && !isUnlocked(this.selected)) {
      body(this, px + 16, py + ph - 34, `${t('unlockReq')}: ${L(c.unlock.text)}`, 22, COLORS.gold, wrap);
    }

    button(this, W / 2 - 150, H - 36, 220, 44, t('back'), () => this.scene.start('Menu'), { size: 11 });
    button(
      this,
      W / 2 + 150,
      H - 36,
      220,
      44,
      t('start'),
      () => {
        this.cameras.main.fadeOut(250, 18, 6, 12);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { run: newRun(this.selected) }));
      },
      { size: 12, enabled: isUnlocked(this.selected) },
    );
  }
}
