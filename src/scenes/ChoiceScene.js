import Phaser from 'phaser';
import { t, L } from '../systems/i18n.js';
import { UPGRADES } from '../data/upgrades.js';
import { title, body, drawPanel, COLORS } from '../systems/ui.js';
import { Controls } from '../systems/controls.js';
import { Sfx } from '../systems/sfx.js';

// Elección de mejora (1 de 3). Cada carta explica la molécula real.
export class ChoiceScene extends Phaser.Scene {
  constructor() {
    super('Choice');
  }

  init(data) {
    this.options = data.options;
    this.onPick = data.onPick;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.picked = false;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setInteractive();
    title(this, W / 2, 46, t('chooseUpgrade'), 16, COLORS.gold);
    body(this, W / 2, 70, t('upgradeHint'), 22, COLORS.textDim).setOrigin(0.5, 0);

    const n = this.options.length;
    const cw = Math.min(280, Math.floor((W - 40) / n) - 14);
    const ch = Math.min(270, H - 150);
    const total = n * cw + (n - 1) * 14;
    const x0 = W / 2 - total / 2;
    const y0 = 110;
    this.options.forEach((id, i) => {
      const u = UPGRADES[id];
      const x = x0 + i * (cw + 14);
      const c = this.add.container(x, y0);
      const g = this.add.graphics();
      const draw = (hover) => {
        g.clear();
        drawPanel(g, 0, 0, cw, ch, { fill: hover ? 0x3d1829 : COLORS.panel, border: hover ? COLORS.accent : COLORS.border });
      };
      draw(false);
      const name = body(this, cw / 2, 16, L(u.name), 28, COLORS.gold, { align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
      const eff = body(this, cw / 2, 20 + name.height + 6, L(u.effect), 22, COLORS.green, { align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
      const fact = body(this, 14, eff.y + eff.height + 14, L(u.fact), 20, COLORS.text, { wordWrap: { width: cw - 28 } });
      c.add([g, name, eff, fact]);
      const z = this.add.zone(0, 0, cw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add(z);
      z.on('pointerover', () => draw(true));
      z.on('pointerout', () => draw(false));
      z.on('pointerup', () => this.pick(id));
      c.setAlpha(0);
      c.y = y0 + 20;
      this.tweens.add({ targets: c, alpha: 1, y: y0, duration: 250, delay: i * 90 });
    });
  }

  pick(id) {
    if (this.picked) return;
    this.picked = true;
    Sfx.pickup();
    Controls.reset();
    this.onPick(id);
    this.scene.stop();
  }
}
