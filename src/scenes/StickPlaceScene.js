import Phaser from 'phaser';
import { t } from '../systems/i18n.js';
import { Save } from '../systems/storage.js';
import { title, body, button, COLORS } from '../systems/ui.js';

// Pantalla para colocar el joystick fijo donde resulte más cómodo.
// La posición se guarda como fracción de la pantalla (stickX, stickY).
export class StickPlaceScene extends Phaser.Scene {
  constructor() {
    super('StickPlace');
  }

  init(data) {
    this.from = data?.from || 'Menu';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.add.rectangle(0, 0, W, H, COLORS.bg, 1).setOrigin(0);
    const k = Save.settings.stickSize === 'large' ? 1.4 : 1;
    this.R = 50 * k;
    const s = Save.settings;
    this.pos = s.stickX != null ? { x: s.stickX * W, y: s.stickY * H } : { x: 70 + this.R, y: H - 60 - this.R };
    this.clamp();

    title(this, W / 2, 30, t('stickPlaceTitle'), 14, COLORS.gold);
    body(this, W / 2, 50, t('stickPlaceHelp'), 22, COLORS.textDim).setOrigin(0.5, 0);

    // botones de ataque y habilidad de referencia (no se mueven)
    const g0 = this.add.graphics();
    const ar = 52 * k;
    const sr = 34 * k;
    g0.lineStyle(2, 0xff8fb0, 0.4);
    g0.strokeCircle(W - 52 - ar, H - 52 - ar, ar);
    g0.lineStyle(2, 0x9fc7ff, 0.4);
    g0.strokeCircle(W - 52 - ar * 2 - sr - 16, H - 28 - sr, sr);
    this.g = this.add.graphics();
    this.draw();

    this.input.on('pointerdown', (p) => this.moveTo(p));
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.moveTo(p);
    });

    button(this, W / 2 - 120, 108, 200, 40, t('save'), () => {
      Save.setSetting('stickMode', 'fixed');
      Save.setSetting('stickX', this.pos.x / W);
      Save.setSetting('stickY', this.pos.y / H);
      this.back();
    }, { size: 10 });
    button(this, W / 2 + 120, 108, 200, 40, t('resetPos'), () => {
      Save.setSetting('stickX', null);
      Save.setSetting('stickY', null);
      this.pos = { x: 70 + this.R, y: H - 60 - this.R };
      this.draw();
    }, { size: 9 });
  }

  clamp() {
    const W = this.scale.width;
    const H = this.scale.height;
    // en la mitad izquierda, sin tapar el HUD de arriba
    this.pos.x = Phaser.Math.Clamp(this.pos.x, this.R + 10, W * 0.45 - this.R * 0.3);
    this.pos.y = Phaser.Math.Clamp(this.pos.y, 150 + this.R, H - this.R - 10);
  }

  moveTo(p) {
    if (p.y < 135) return; // zona de los botones
    this.pos = { x: p.x, y: p.y };
    this.clamp();
    this.draw();
  }

  draw() {
    const g = this.g;
    g.clear();
    g.fillStyle(0xffffff, 0.12);
    g.fillCircle(this.pos.x, this.pos.y, this.R);
    g.lineStyle(3, 0xffd166, 0.9);
    g.strokeCircle(this.pos.x, this.pos.y, this.R);
    g.fillStyle(0xf4d8e0, 0.6);
    g.fillCircle(this.pos.x, this.pos.y, this.R * 0.44);
  }

  back() {
    this.scene.start('Settings', { from: this.from });
  }
}
