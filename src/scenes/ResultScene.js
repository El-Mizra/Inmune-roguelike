import Phaser from 'phaser';
import { t, L, N } from '../systems/i18n.js';
import { ENEMIES, FLOOR_BOSSES } from '../data/enemies.js';
import { floorLabel } from '../data/zones.js';
import { CELLS } from '../data/cells.js';
import { MEMORY_TIERS } from '../systems/storage.js';
import { title, body, button, panel, fadeIn, floatingBackdrop, restartOnResize, COLORS } from '../systems/ui.js';

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.data_ = data;
  }

  create() {
    const d = this.data_;
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    fadeIn(this, 400);
    floatingBackdrop(this, 12);
    restartOnResize(this, d);

    title(this, W / 2, 44, d.won ? t('victory') : t('defeat'), 16, d.won ? COLORS.gold : COLORS.red);
    body(this, W / 2, 66, d.won ? t('victorySub') : t('defeatSub'), 24, COLORS.text).setOrigin(0.5, 0);

    const pw = Math.min(W - 30, 760);
    const px = W / 2 - pw / 2;
    const py = 104;
    const ph = H - py - 74;
    panel(this, px, py, pw, ph, { alpha: 0.9 });
    const total = d.kills.reduce((a, k) => a + k.n, 0);
    body(this, px + 20, py + 12, `${t('time')}: ${fmtTime(d.time)}    ${t('kills')}: ${total}    ${t('floor')}: ${floorLabel(Math.min(d.floor, FLOOR_BOSSES.length - 1))}`, 22, COLORS.text);

    // eliminados por especie
    const list = d.kills.filter((k) => ENEMIES[k.id] && !ENEMIES[k.id].hidden || k.id === 'infected').sort((a, b) => b.n - a.n);
    const colW = (pw - 40) / 2;
    list.slice(0, 8).forEach((k, i) => {
      const def = ENEMIES[k.id];
      const x = px + 20 + (i % 2) * colW;
      const y = py + 50 + Math.floor(i / 2) * 34;
      this.add.image(x + 12, y + 12, def.texture, 0).setScale(def.boss ? 0.6 : 2);
      body(this, x + 32, y, `${N(def)} ×${k.n}`, 22, COLORS.text);
    });

    // memoria inmunológica (columna izquierda) y células desbloqueadas (derecha)
    const unlocked = d.unlocked || [];
    const gains = d.kills.filter((k) => k.after > k.before);
    const top = py + 50 + Math.ceil(Math.min(list.length, 8) / 2) * 34 + 10;
    const memW = unlocked.length ? colW - 10 : pw - 40;
    let y = top;
    body(this, px + 20, y, `${t('memoryGain')}:`, 22, COLORS.green);
    y += 28;
    if (!gains.length) body(this, px + 20, y, '—', 20, COLORS.textDim);
    for (const g of gains.slice(0, 4)) {
      const bonus = Math.round(MEMORY_TIERS[g.after - 1].bonus * 100);
      const line = body(this, px + 20, y, `${N(ENEMIES[g.id])}: ${t('tier')} ${g.after} (+${bonus}%)`, 20, COLORS.green, { wordWrap: { width: memW } });
      y += line.height + 4;
    }

    if (unlocked.length) {
      const ux = px + 20 + colW;
      let uy = top;
      body(this, ux, uy, t('newCell'), 22, COLORS.gold);
      uy += 30;
      unlocked.forEach((id) => {
        const c = CELLS[id];
        const spr = this.add.sprite(ux + 12, uy + 11, c.texture, 0).setScale(1.6);
        spr.play(`${c.texture}_idle`);
        const txt = body(this, ux + 32, uy, L(c.name), 22, COLORS.gold);
        this.tweens.add({ targets: [spr, txt], alpha: { from: 0.5, to: 1 }, duration: 500, yoyo: true, repeat: -1 });
        uy += 28;
      });
    }

    button(this, W / 2 - 150, H - 36, 240, 44, t('toMenu'), () => this.scene.start('Menu'), { size: 10 });
    button(this, W / 2 + 150, H - 36, 240, 44, t('playAgain'), () => this.scene.start('CellSelect'), { size: 10 });
  }
}
