import Phaser from 'phaser';
import { t, L } from '../systems/i18n.js';
import { UPGRADES } from '../data/upgrades.js';
import { title, body, drawPanel, COLORS } from '../systems/ui.js';
import { Controls } from '../systems/controls.js';
import { Sfx } from '../systems/sfx.js';
import { Save } from '../systems/storage.js';

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
    const maxH = H - 130;
    const total = n * cw + (n - 1) * 14;
    const x0 = W / 2 - total / 2;
    const y0 = 110;
    // primero se crean los textos y luego todas las cartas toman la altura de la más alta
    const cards = this.options.map((id, i) => {
      const u = UPGRADES[id];
      const c = this.add.container(x0 + i * (cw + 14), y0);
      const g = this.add.graphics();
      // lo primero que se lee es qué hace; la molécula y el dato real van debajo
      const eff = body(this, cw / 2, 16, L(u.effect), 28, COLORS.gold, { align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
      const name = body(this, cw / 2, eff.y + eff.height + 10, L(u.name), 22, COLORS.green, { align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5, 0);
      const fact = body(this, 14, name.y + name.height + 12, L(u.fact), 22, COLORS.text, { wordWrap: { width: cw - 28 } });
      c.add([g, eff, name, fact]);
      return { id, i, c, g, h: fact.y + fact.height + 18 };
    });
    const ch = Math.min(maxH, Math.max(...cards.map((k) => k.h)));
    // en pantallas táctiles: primer toque marca la carta, segundo toque confirma
    this.selected = null;
    this.readyAt = this.game.loop.time + 550;
    this.redraws = [];
    this.hint = body(this, W / 2, y0 + ch + 14, '', 22, COLORS.gold).setOrigin(0.5, 0);
    for (const { id, i, c, g } of cards) {
      const draw = (hover) => {
        g.clear();
        const sel = this.selected === id;
        drawPanel(g, 0, 0, cw, ch, {
          fill: sel ? 0x5a2236 : hover ? 0x3d1829 : COLORS.panel,
          border: sel || hover ? COLORS.accent : COLORS.border,
        });
      };
      draw(false);
      this.redraws.push(draw);
      const z = this.add.zone(0, 0, cw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add(z);
      z.on('pointerover', () => draw(true));
      z.on('pointerout', () => draw(false));
      z.on('pointerup', (p) => this.pick(id, p));
      c.setAlpha(0);
      c.y = y0 + 20;
      this.tweens.add({ targets: c, alpha: 1, y: y0, duration: 250, delay: i * 90 });
    }
  }

  pick(id, pointer) {
    if (this.picked || this.game.loop.time < this.readyAt) return;
    // en pantallas táctiles: primer toque marca, segundo toque (un instante después) confirma.
    // El "clic" que el celular simula justo tras el toque no cuenta como segundo toque.
    if (Save.isTouch || pointer?.wasTouch) {
      if (this.selected !== id) {
        this.selected = id;
        this.selectedAt = this.game.loop.time;
        this.redraws.forEach((d) => d(false));
        this.hint.setText(t('tapAgain'));
        Sfx.ui();
        return;
      }
      if (this.game.loop.time - this.selectedAt < 300) return;
    }
    this.picked = true;
    Sfx.pickup();
    Controls.reset();
    this.onPick(id);
    this.scene.stop();
  }
}
