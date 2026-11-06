import Phaser from 'phaser';
import { t, L } from '../systems/i18n.js';
import { UPGRADES, UPGRADE_IDS } from '../data/upgrades.js';
import { Save } from '../systems/storage.js';
import { title, body, button, panel, restartOnResize, COLORS, FONT_BODY } from '../systems/ui.js';
import { Controls } from '../systems/controls.js';

// Panel de pruebas (solo con "Modo de pruebas" activado en Ajustes).
// Los trucos viven en run.cheats y se mantienen al cambiar de piso.
export class DebugScene extends Phaser.Scene {
  constructor() {
    super('Debug');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    restartOnResize(this);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
    const gs = this.scene.get('Game');
    const c = gs.cheats;
    const p = gs.player;

    const pw = Math.min(W - 20, 900);
    const ph = Math.min(H - 16, 500);
    const px = W / 2 - pw / 2;
    const py = H / 2 - ph / 2;
    panel(this, px, py, pw, ph);
    title(this, W / 2, py + 22, t('debugMode'), 14, COLORS.gold);
    const again = () => this.scene.restart();

    // interruptores
    const tw = (pw - 40) / 3 - 8;
    [
      ['god', t('dbgGod')],
      ['dmg', t('dbgDmg')],
      ['atp', t('dbgAtp')],
    ].forEach(([key, label], i) => {
      button(this, px + 20 + tw / 2 + i * (tw + 12), py + 58, tw, 34, `${label}: ${c[key] ? 'ON' : 'OFF'}`, () => {
        c[key] = !c[key];
        again();
      }, { size: 9, selected: c[key] });
    });

    // velocidades
    const half = (pw - 40) / 2;
    const speedRow = (x0, label, key, values) => {
      body(this, x0, py + 92, label, 20, COLORS.text);
      values.forEach((v, i) => {
        button(this, x0 + 30 + i * 74 + 160, py + 104, 68, 30, `x${v}`, () => {
          c[key] = v;
          if (key === 'speed') gs.applySpeed();
          again();
        }, { size: 9, selected: c[key] === v });
      });
    };
    speedRow(px + 20, t('dbgGameSpeed'), 'speed', [1, 2, 3]);
    speedRow(px + 20 + half, t('dbgMoveSpeed'), 'move', [1, 1.5, 2]);

    // acciones
    const aw = (pw - 40) / 5 - 8;
    [
      [t('dbgHeal'), () => gs.debugHeal()],
      [t('dbgKill'), () => gs.debugKillRoom()],
      [t('dbgBoss'), () => gs.debugGoBoss()],
      [t('dbgNextFloor'), () => gs.debugNextFloor()],
      [t('dbgAllUpgrades'), () => {
        for (const id of UPGRADE_IDS) {
          if (!p.run.upgrades.includes(id)) p.addUpgrade(id);
          Save.discover(`up_${id}`);
        }
        gs.debugHeal();
        gs.events.emit('toast', `+${UPGRADE_IDS.length} ${t('dbgUpgradesAdded')}`);
      }],
    ].forEach(([label, fn], i) => {
      button(this, px + 20 + aw / 2 + i * (aw + 10), py + 150, aw, 34, label, () => {
        this.close();
        fn();
      }, { size: 8 });
    });

    // mejoras
    body(this, px + 20, py + 176, `${t('dbgAddUpgrade')} (${p.run.upgrades.length})`, 20, COLORS.green);
    const cols = 5;
    const uw = (pw - 40) / cols - 6;
    UPGRADE_IDS.forEach((id, i) => {
      const n = p.run.upgrades.filter((u) => u === id).length;
      const x = px + 20 + uw / 2 + (i % cols) * (uw + 6);
      const y = py + 218 + Math.floor(i / cols) * 38;
      button(this, x, y, uw, 32, `${L(UPGRADES[id].name)}${n ? ` ×${n}` : ''}`, () => {
        p.addUpgrade(id);
        Save.discover(`up_${id}`);
        gs.events.emit('toast', `+ ${L(UPGRADES[id].name)}`);
        again();
      }, { font: FONT_BODY, size: 18, selected: n > 0 });
    });

    button(this, W / 2, py + ph - 28, 220, 38, t('close'), () => this.close(), { size: 11 });
    this.input.keyboard.on('keydown-ESC', () => this.close());
    this.input.keyboard.on('keydown-T', () => this.close());
  }

  close() {
    Controls.reset();
    this.scene.stop();
    this.scene.resume('Game');
  }
}
