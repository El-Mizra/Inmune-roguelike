import Phaser from 'phaser';
import { t } from '../systems/i18n.js';
import { Save } from '../systems/storage.js';
import { Sfx, Music } from '../systems/sfx.js';
import { title, body, button, floatingBackdrop, fadeIn, restartOnResize, COLORS } from '../systems/ui.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    fadeIn(this);
    floatingBackdrop(this, 22);
    restartOnResize(this);
    Music.stop();

    const top = H * 0.17;
    title(this, W / 2 + 3, top + 3, t('title'), 40, '#3a1220');
    title(this, W / 2, top, t('title'), 40, COLORS.gold);
    body(this, W / 2, top + 42, t('subtitle'), 28, COLORS.text).setOrigin(0.5);

    // neutrófilo persiguiendo a un estafilococo
    const hero = this.add.sprite(W / 2 - 30, H * 0.45, 'neutrophil', 0).setScale(5).play('neutrophil_idle');
    const prey = this.add.sprite(W / 2 + 60, H * 0.45, 'saureus', 0).setScale(4).play('saureus_idle');
    this.tweens.add({ targets: hero, y: hero.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: prey, y: prey.y + 5, x: prey.x + 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const by = H * 0.62;
    // si hay una partida guardada, se puede retomar desde el inicio de su piso
    const saved = Save.loadRun();
    let yb = by;
    if (saved) {
      button(this, W / 2, yb, 280, 44, `${t('continueRun')} · ${t('floor')} 1-${saved.floor + 1}`, () => this.go('Game', { run: saved }), { size: 10, selected: true });
      yb += 50;
    }
    button(this, W / 2, yb, 280, saved ? 40 : 46, saved ? t('newRun') : t('play'), () => this.go('CellSelect'), { size: saved ? 11 : 14 });
    button(this, W / 2, yb + (saved ? 48 : 56), 280, 40, t('codex'), () => this.go('Codex', { from: 'Menu' }), { size: 11 });
    button(this, W / 2, yb + (saved ? 96 : 104), 280, 40, t('settings'), () => this.go('Settings', { from: 'Menu' }), { size: 11 });

    // idioma rápido
    const langBtn = (x, code, label) =>
      button(this, x, 30, 54, 32, label, () => {
        Save.setSetting('lang', code);
        this.scene.restart();
      }, { size: 10, selected: Save.settings.lang === code });
    langBtn(W - 96, 'es', 'ES');
    langBtn(W - 38, 'en', 'EN');

    const st = Save.stats;
    body(this, 14, H - 30, `${t('stats')}: ${st.runs}  ·  ${t('wins')}: ${st.wins}`, 20, COLORS.textDim);
    body(this, W - 14, H - 30, 'v0.1 · prototipo', 20, COLORS.textDim).setOrigin(1, 0);

    this.input.once('pointerdown', () => Sfx.unlock());
  }

  go(key, data) {
    this.cameras.main.fadeOut(180, 18, 6, 12);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
