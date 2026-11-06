import Phaser from 'phaser';
import { t } from '../systems/i18n.js';
import { Save } from '../systems/storage.js';
import { title, body, button, panel, restartOnResize, COLORS } from '../systems/ui.js';

// Ajustes. Desde el menú se abre como pantalla completa; desde la pausa,
// como capa encima del juego.
export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  init(data) {
    this.from = data?.from || 'Menu';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    restartOnResize(this, { from: this.from });
    if (this.from === 'Menu') this.cameras.main.setBackgroundColor(COLORS.bg);
    else this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();

    const pw = Math.min(W - 30, 640);
    const ph = 460;
    const px = W / 2 - pw / 2;
    const py = H / 2 - ph / 2;
    panel(this, px, py, pw, ph);
    title(this, W / 2, py + 28, t('settings'), 16, COLORS.gold);

    const restart = () => this.scene.restart({ from: this.from });
    const row = (y, label, options, current, onPick) => {
      body(this, px + 24, y - 12, label, 24, COLORS.text);
      const bw = Math.min(150, (pw - 220) / options.length - 8);
      options.forEach(([value, text], i) => {
        button(this, px + 210 + bw / 2 + i * (bw + 8), y, bw, 36, text, () => {
          onPick(value);
          restart();
        }, { size: 9, selected: current === value });
      });
    };

    const s = Save.settings;
    row(py + 90, t('language'), [['es', 'Español'], ['en', 'English']], s.lang, (v) => Save.setSetting('lang', v));
    row(
      py + 150,
      t('aim'),
      [
        ['manual', t('aim_manual')],
        ['assist', t('aim_assist')],
        ['auto', t('aim_auto')],
      ],
      s.aim,
      (v) => Save.setSetting('aim', v),
    );
    body(this, px + 24, py + 178, t(`aimHelp_${s.aim}`), 20, COLORS.textDim, { wordWrap: { width: pw - 48 } });
    row(py + 240, t('sound'), [[true, t('on')], [false, t('off')]], s.sound, (v) => Save.setSetting('sound', v));

    row(py + 350, t('debugMode'), [[true, t('on')], [false, t('off')]], !!s.debug, (v) => Save.setSetting('debug', v));
    body(this, px + 24, py + 280, Save.isTouch ? t('controlsTouch') : t('controlsPc'), 20, COLORS.textDim, {
      wordWrap: { width: pw - 48 },
    });

    const fromMenu = this.from === 'Menu';
    button(this, fromMenu ? W / 2 - 120 : W / 2, py + ph - 36, 220, 42, t('back'), () => this.close(), { size: 11 });
    if (fromMenu) {
      // doble toque para confirmar: evita borrar el progreso por accidente
      let armed = false;
      const rb = button(this, W / 2 + 120, py + ph - 36, 220, 42, t('resetProgress'), () => {
        if (!armed) {
          armed = true;
          rb.setLabel(t('resetConfirm'));
          return;
        }
        Save.resetProgress();
        this.scene.restart({ from: this.from });
      }, { size: 9, color: COLORS.red });
    }
  }

  close() {
    if (this.from === 'Menu') {
      this.scene.start('Menu');
    } else {
      // reinicia la pausa para que tome el idioma nuevo
      this.scene.stop('Pause');
      this.scene.launch('Pause');
      this.scene.stop();
    }
  }
}
