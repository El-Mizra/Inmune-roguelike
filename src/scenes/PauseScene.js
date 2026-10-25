import Phaser from 'phaser';
import { t, L } from '../systems/i18n.js';
import { UPGRADES } from '../data/upgrades.js';
import { title, body, button, panel, restartOnResize, COLORS } from '../systems/ui.js';
import { Controls } from '../systems/controls.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    restartOnResize(this);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    const pw = Math.min(W - 30, 460);
    const ph = 380;
    const px = W / 2 - pw / 2;
    const py = H / 2 - ph / 2;
    panel(this, px, py, pw, ph);
    title(this, W / 2, py + 30, t('paused'), 16, COLORS.gold);

    const gs = this.scene.get('Game');
    const ups = gs.run.upgrades.map((id) => L(UPGRADES[id].name)).join(', ') || '—';
    body(this, px + 20, py + 56, `${t('upgradesTaken')}: ${ups}`, 20, COLORS.textDim, { wordWrap: { width: pw - 40 } });

    const bx = W / 2;
    button(this, bx, py + 150, 280, 44, t('resume'), () => this.resume(), { size: 12 });
    button(this, bx, py + 204, 280, 40, t('codex'), () => {
      this.scene.sleep();
      this.scene.launch('Codex', { from: 'Pause' });
    }, { size: 10 });
    button(this, bx, py + 254, 280, 40, t('settings'), () => {
      this.scene.sleep();
      this.scene.launch('Settings', { from: 'Pause' });
    }, { size: 10 });
    button(this, bx, py + 316, 280, 40, t('quit'), () => {
      this.scene.stop();
      this.scene.resume('Game');
      gs.ending = true;
      gs.finishRun(false);
    }, { size: 10, color: COLORS.red });

    this.input.keyboard.on('keydown-ESC', () => this.resume());
  }

  resume() {
    Controls.reset();
    this.scene.stop();
    this.scene.resume('Game');
  }
}
