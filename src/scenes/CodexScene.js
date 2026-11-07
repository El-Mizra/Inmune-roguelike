import Phaser from 'phaser';
import { t, L, N } from '../systems/i18n.js';
import { Save, memoryTier, MEMORY_TIERS } from '../systems/storage.js';
import { ENEMIES, CODEX_PATHOGENS } from '../data/enemies.js';
import { CELLS, CELL_ORDER } from '../data/cells.js';
import { UPGRADES, UPGRADE_IDS } from '../data/upgrades.js';
import { title, body, button, panel, restartOnResize, COLORS } from '../systems/ui.js';

const CATEGORY_KEY = {
  gramPos: 'gramPos',
  gramNeg: 'gramNeg',
  fungus: 'fungus',
  virus: 'virus',
  host: 'host',
  boss: 'boss',
  cancer: 'cancer',
};

// Enciclopedia: aprende sobre lo que has encontrado.
export class CodexScene extends Phaser.Scene {
  constructor() {
    super('Codex');
  }

  init(data) {
    this.from = data?.from || 'Menu';
    this.tab = data?.tab || 'pathogens';
    this.entry = data?.entry || null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    restartOnResize(this, { from: this.from, tab: this.tab, entry: this.entry });
    if (this.from === 'Menu') this.cameras.main.setBackgroundColor(COLORS.bg);
    else this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0).setInteractive();
    Save.discover('cell_neutrophil');

    title(this, W / 2, 26, t('codex'), 16, COLORS.gold);

    // pestañas
    const tabs = [
      ['pathogens', t('pathogens')],
      ['cells', t('cells')],
      ['molecules', t('molecules')],
    ];
    const tw = Math.min(200, (W - 40) / 3 - 8);
    tabs.forEach(([id, label], i) => {
      button(this, W / 2 + (i - 1) * (tw + 8), 62, tw, 34, label, () => this.scene.restart({ from: this.from, tab: id }), {
        size: 9,
        selected: this.tab === id,
      });
    });

    const entries = this.entries();
    if (!this.entry || !entries.find((e) => e.id === this.entry)) this.entry = (entries.find((e) => e.found) || entries[0]).id;

    // lista
    const lx = 16;
    const ly = 90;
    const lw = Math.min(270, W * 0.32);
    const lh = H - ly - 64;
    panel(this, lx, ly, lw, lh, { alpha: 0.9 });
    const rowH = Math.min(32, Math.floor((lh - 12) / entries.length));
    entries.forEach((e, i) => {
      const y = ly + 6 + i * rowH;
      const sel = e.id === this.entry;
      if (sel) {
        const g = this.add.graphics();
        g.fillStyle(0x5a2236, 1);
        g.fillRect(lx + 4, y, lw - 8, rowH - 2);
      }
      if (e.icon && e.found) {
        const img = this.add.image(lx + 22, y + rowH / 2 - 1, e.icon, 0);
        const size = Math.max(img.width, img.height);
        img.setScale(size <= 12 && rowH > 24 ? 2 : size <= 26 ? 1 : 0.5);
      }
      const label = e.found ? e.label : t('undiscovered');
      body(this, lx + 42, y + rowH / 2 - 12, label, rowH > 24 ? 22 : 18, sel ? COLORS.gold : e.found ? COLORS.text : COLORS.textDim, {
        fixedWidth: lw - 50,
      });
      const z = this.add.zone(lx + 4, y, lw - 8, rowH - 2).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerup', () => this.scene.restart({ from: this.from, tab: this.tab, entry: e.id }));
    });

    // ficha
    const dx = lx + lw + 12;
    const dw = W - dx - 16;
    panel(this, dx, ly, dw, lh, { alpha: 0.9 });
    const cont = this.add.container(0, 0);
    const e = entries.find((x) => x.id === this.entry);
    let y = ly + 12;
    const add = (o) => {
      cont.add(o);
      return o;
    };
    const wrap = { wordWrap: { width: dw - 40 } };
    if (!e.found) {
      add(body(this, dx + 20, y, t('undiscovered'), 30, COLORS.textDim));
      add(body(this, dx + 20, y + 40, t('undiscoveredHint'), 22, COLORS.textDim, wrap));
    } else {
      if (e.icon) {
        add(this.add.image(dx + dw - 50, y + 34, e.icon, 0).setScale(e.big ? 2 : 4));
      }
      add(body(this, dx + 20, y, e.label, 30, COLORS.gold, { wordWrap: { width: dw - 120 }, fontStyle: e.italic ? 'italic' : 'normal' }));
      y += 34;
      if (e.sub) {
        add(body(this, dx + 20, y, e.sub, 20, COLORS.pink));
        y += 26;
      }
      if (e.summary) {
        const s = add(body(this, dx + 20, y, e.summary, 22, COLORS.text, { wordWrap: { width: dw - 120 } }));
        y += s.height + 10;
      }
      y = Math.max(y, ly + 84);
      for (const f of e.facts || []) {
        const ft = add(body(this, dx + 34, y, f, 20, COLORS.text, { wordWrap: { width: dw - 60 } }));
        add(body(this, dx + 20, y, '•', 20, COLORS.gold));
        y += ft.height + 6;
      }
      if (e.tip) {
        y += 4;
        const tp = add(body(this, dx + 20, y, `${t('inGame')}: ${e.tip}`, 20, COLORS.blue, wrap));
        y += tp.height + 8;
      }
      if (e.memory) {
        const m = add(body(this, dx + 20, y, e.memory, 20, COLORS.green, wrap));
        y += m.height + 8;
      }
    }

    // desplazamiento si la ficha no cabe
    const viewTop = ly + 4;
    const viewH = lh - 8;
    const contentH = y - viewTop + 10;
    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(dx, viewTop, dw, viewH);
    cont.setMask(maskG.createGeometryMask());
    const maxScroll = Math.max(0, contentH - viewH);
    if (maxScroll > 0) {
      body(this, dx + dw - 14, ly + lh - 26, '▼', 20, COLORS.textDim).setOrigin(1, 0);
      const scroll = (dy) => {
        cont.y = Phaser.Math.Clamp(cont.y - dy, -maxScroll, 0);
      };
      this.input.on('wheel', (_p, _o, _dx, dy) => scroll(dy * 0.5));
      this.input.on('pointermove', (p) => {
        if (p.isDown && p.x > dx) scroll(p.prevPosition.y - p.y);
      });
    }

    button(this, W / 2, H - 30, 220, 40, t('back'), () => this.close(), { size: 11 });
  }

  entries() {
    if (this.tab === 'pathogens') {
      return CODEX_PATHOGENS.map((id) => {
        const d = ENEMIES[id];
        const tier = memoryTier(id);
        const kills = Save.kills[id] || 0;
        const next = MEMORY_TIERS[tier];
        let memory = `${t('memory')}: ${t('tier')} ${tier}/${MEMORY_TIERS.length} · ${kills} ${t('killsCount')}`;
        if (tier) memory += ` · +${Math.round(MEMORY_TIERS[tier - 1].bonus * 100)}% ${t('dmgVs')}`;
        if (next) memory += ` · ${next.kills - kills} →`;
        return {
          id,
          found: Save.isDiscovered(id),
          label: N(d),
          italic: Save.settings.names === 'science' && typeof d.name === 'string',
          icon: d.texture,
          big: d.boss,
          // con nombres sencillos, el nombre científico aparece debajo
          sub:
            (Save.settings.names !== 'science' && d.simpleName && L(d.simpleName) !== L(d.name) ? `${L(d.name)} · ` : '') +
            t(CATEGORY_KEY[d.category] || 'boss') +
            (d.boss ? ` · ${t('boss')}` : ''),
          summary: L(d.summary),
          facts: L(d.facts),
          tip: L(d.tip),
          memory: d.boss ? null : memory,
        };
      });
    }
    if (this.tab === 'cells') {
      return CELL_ORDER.map((id) => {
        const c = CELLS[id];
        return {
          id,
          found: c.playable ? true : false,
          label: L(c.name),
          icon: c.texture,
          sub: c.branch === 'innate' ? t('innate') : t('adaptive'),
          summary: L(c.summary),
          facts: c.facts ? L(c.facts) : [],
          tip: c.skill ? `${L(c.skill.name)} — ${L(c.skill.desc)}` : null,
        };
      });
    }
    return UPGRADE_IDS.map((id) => {
      const u = UPGRADES[id];
      return {
        id,
        found: Save.isDiscovered(`up_${id}`),
        label: L(u.name),
        sub: L(u.effect),
        facts: [L(u.fact)],
      };
    });
  }

  close() {
    if (this.from === 'Menu') this.scene.start('Menu');
    else {
      this.scene.stop();
      this.scene.wake('Pause');
    }
  }
}
