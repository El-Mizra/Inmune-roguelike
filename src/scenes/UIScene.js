import Phaser from 'phaser';
import { Controls } from '../systems/controls.js';
import { Save } from '../systems/storage.js';
import { t, L } from '../systems/i18n.js';
import { ENEMIES } from '../data/enemies.js';
import { FONT_TITLE, FONT_BODY, COLORS, drawPanel } from '../systems/ui.js';
import { Sfx } from '../systems/sfx.js';

// HUD + controles táctiles. Corre en paralelo a la escena de juego.
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.gs = this.scene.get('Game');
    this.input.addPointer(3);
    this.touchEnabled = Save.isTouch;
    this.touches = { move: null, aim: null };
    this.discoverQueue = [];

    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(-10).setAlpha(0.9);
    this.hud = this.add.graphics();
    this.mini = this.add.graphics();
    this.tg = this.add.graphics();
    this.icons = [
      this.add.image(0, 0, 'icon_heart').setScale(2).setOrigin(0),
      this.add.image(0, 0, 'icon_armor').setScale(2).setOrigin(0),
      this.add.image(0, 0, 'icon_atp').setScale(2).setOrigin(0),
    ];
    const small = { fontFamily: FONT_TITLE, fontSize: '8px', color: COLORS.text };
    this.atpText = this.add.text(0, 0, '', small);
    this.floorText = this.add.text(0, 0, '', { ...small, color: COLORS.textDim }).setOrigin(1, 0);
    this.skillText = this.add.text(0, 0, '', { fontFamily: FONT_BODY, fontSize: '20px', color: COLORS.text });
    this.bossName = this.add.text(0, 0, '', { fontFamily: FONT_BODY, fontSize: '22px', color: '#ffd0d0' }).setOrigin(0.5, 1);
    this.bannerTitle = this.add.text(0, 0, '', { fontFamily: FONT_TITLE, fontSize: '16px', color: COLORS.gold, align: 'center', stroke: '#12060c', strokeThickness: 6 }).setOrigin(0.5).setAlpha(0);
    this.bannerSub = this.add.text(0, 0, '', { fontFamily: FONT_BODY, fontSize: '26px', color: COLORS.text, align: 'center', stroke: '#12060c', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0);
    this.toast = this.add.text(0, 0, '', { fontFamily: FONT_TITLE, fontSize: '10px', color: COLORS.green, stroke: '#12060c', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0);
    this.hint = this.add.text(0, 0, '', { fontFamily: FONT_BODY, fontSize: '20px', color: COLORS.textDim, align: 'center', stroke: '#12060c', strokeThickness: 4 }).setOrigin(0.5, 1).setAlpha(0);

    // ficha de "nuevo patógeno"
    this.disc = this.add.container(0, 0).setAlpha(0);
    this.discG = this.add.graphics();
    this.discTitle = this.add.text(12, 8, '', { fontFamily: FONT_TITLE, fontSize: '8px', color: COLORS.gold });
    this.discName = this.add.text(12, 22, '', { fontFamily: FONT_BODY, fontSize: '22px', color: COLORS.text, fontStyle: 'italic' });
    this.discBody = this.add.text(12, 44, '', { fontFamily: FONT_BODY, fontSize: '18px', color: COLORS.textDim, wordWrap: { width: 276 } });
    this.discIcon = this.add.image(300, 30, 'saureus').setScale(3);
    this.disc.add([this.discG, this.discTitle, this.discName, this.discBody, this.discIcon]);

    // botón de pausa
    this.pauseZone = this.add.zone(0, 0, 40, 40).setOrigin(0).setInteractive({ useHandCursor: true });
    // botón del modo de pruebas (solo si está activado en Ajustes)
    this.debugZone = this.add.zone(0, 0, 40, 40).setOrigin(0).setInteractive({ useHandCursor: true });
    this.debugZone.on('pointerdown', () => {
      Controls.debugQueued = true;
    });
    this.syncDebugZone();
    this.pauseZone.on('pointerdown', () => {
      Controls.pauseQueued = true;
    });

    this.layout();
    const onResize = () => this.layout();
    this.scale.on('resize', onResize);

    // eventos de la escena de juego
    const on = (ev, fn) => {
      this.gs.events.on(ev, fn, this);
      this.events.once('shutdown', () => this.gs.events.off(ev, fn, this));
    };
    on('banner', this.showBanner);
    on('hint', this.showHint);
    on('toast', this.showToast);
    on('discover', (id) => {
      this.discoverQueue.push(id);
      if (!this.discBusy) this.nextDiscover();
    });
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      Controls.reset();
    });

    // controles táctiles
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
  }

  layout() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.vignette.setDisplaySize(W, H);
    this.W = W;
    this.H = H;
    const x0 = 14;
    const y0 = 12;
    this.icons[0].setPosition(x0, y0);
    this.icons[1].setPosition(x0, y0 + 22);
    this.icons[2].setPosition(x0, y0 + 44);
    this.atpText.setPosition(x0 + 176, y0 + 49);
    this.floorText.setPosition(W - 14, 118);
    this.skillText.setPosition(16, H - 40);
    this.bossName.setPosition(W / 2, H - 46);
    this.bannerTitle.setPosition(W / 2, H * 0.24);
    this.bannerSub.setPosition(W / 2, H * 0.24 + 32);
    this.toast.setPosition(W / 2, H * 0.36);
    this.hint.setPosition(W / 2, H - 70);
    this.disc.setPosition(14, 84);
    this.pauseZone.setPosition(W - 154 - 50, 10);
    this.debugZone.setPosition(W - 154 - 100, 10);
    this.btnAttack = { x: W - 104, y: H - 104, r: 52 };
    this.btnSkill = { x: W - 206, y: H - 62, r: 34 };
  }

  // ---------------------------------------------------------------
  // Controles táctiles
  gameRunning() {
    return this.scene.isActive('Game');
  }

  onDown(p) {
    if (!p.wasTouch) return;
    this.touchEnabled = true;
    Sfx.unlock();
    if (!this.gameRunning()) return;
    const W = this.W;
    if (p.x > (Save.settings.debug ? this.debugZone.x : this.pauseZone.x) - 6 && p.y < 60) return;
    if (Phaser.Math.Distance.Between(p.x, p.y, this.btnSkill.x, this.btnSkill.y) < this.btnSkill.r + 10) {
      Controls.skillQueued = true;
      this.skillFlash = 150;
      return;
    }
    if (p.x < W * 0.45) {
      if (this.touches.move == null) this.touches.move = { id: p.id, bx: p.x, by: p.y, x: p.x, y: p.y };
    } else if (this.touches.aim == null) {
      this.touches.aim = { id: p.id, bx: p.x, by: p.y, x: p.x, y: p.y };
      Controls.touchFire = true;
      Controls.touchAimActive = false;
    }
  }

  onMove(p) {
    const m = this.touches.move;
    if (m && m.id === p.id) {
      m.x = p.x;
      m.y = p.y;
      let dx = p.x - m.bx;
      let dy = p.y - m.by;
      const d = Math.hypot(dx, dy);
      const R = 50;
      // el stick "persigue" al dedo si se aleja demasiado
      if (d > R * 1.4) {
        m.bx = p.x - (dx / d) * R * 1.4;
        m.by = p.y - (dy / d) * R * 1.4;
        dx = p.x - m.bx;
        dy = p.y - m.by;
      }
      const k = Math.min(1, Math.hypot(dx, dy) / R);
      const a = Math.atan2(dy, dx);
      Controls.touchMoveX = k > 0.15 ? Math.cos(a) * k : 0;
      Controls.touchMoveY = k > 0.15 ? Math.sin(a) * k : 0;
    }
    const s = this.touches.aim;
    if (s && s.id === p.id) {
      s.x = p.x;
      s.y = p.y;
      const dx = p.x - s.bx;
      const dy = p.y - s.by;
      const d = Math.hypot(dx, dy);
      if (d > 12) {
        Controls.touchAimActive = true;
        Controls.touchAimX = dx / d;
        Controls.touchAimY = dy / d;
      }
    }
  }

  onUp(p) {
    if (this.touches.move && this.touches.move.id === p.id) {
      this.touches.move = null;
      Controls.touchMoveX = 0;
      Controls.touchMoveY = 0;
    }
    if (this.touches.aim && this.touches.aim.id === p.id) {
      this.touches.aim = null;
      Controls.touchFire = false;
      Controls.touchAimActive = false;
    }
  }

  // ---------------------------------------------------------------
  syncDebugZone() {
    const on = !!Save.settings.debug;
    if (this.debugOn === on) return;
    this.debugOn = on;
    this.debugZone.setVisible(on);
    if (on) this.debugZone.setInteractive({ useHandCursor: true });
    else this.debugZone.disableInteractive();
  }

  update(_t, dt) {
    this.syncDebugZone();
    const gs = this.gs;
    if (!gs || !gs.player) return;
    if (!this.gameRunning() && (this.touches.move || this.touches.aim)) {
      this.touches = { move: null, aim: null };
      Controls.reset();
    }
    this.drawHud();
    this.drawMinimap();
    this.drawBoss();
    this.drawTouch(dt);
  }

  drawHud() {
    const p = this.gs.player;
    const s = p.stats;
    const g = this.hud;
    g.clear();
    drawPanel(g, 6, 6, 224, 70, { alpha: 0.75 });
    const x = 36;
    const seg = (y, n, max, fill, empty) => {
      const w = Math.min(16, Math.floor(184 / Math.max(1, max)) - 2);
      for (let i = 0; i < max; i++) {
        g.fillStyle(i < n ? fill : empty, 1);
        g.fillRect(x + i * (w + 2), y, w, 12);
        if (i < n) {
          g.fillStyle(0xffffff, 0.25);
          g.fillRect(x + i * (w + 2), y, w, 2);
        }
      }
    };
    seg(14, Math.ceil(p.hp), s.maxHp, 0xff5c7c, 0x3a1220);
    seg(36, p.armor, s.maxArmor, 0xb8c6e8, 0x262a3a);
    g.fillStyle(0x3a2a10, 1);
    g.fillRect(x, 58, 136, 12);
    g.fillStyle(0xffd166, 1);
    g.fillRect(x, 58, Math.round((136 * p.atp) / s.maxAtp), 12);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(x, 58, Math.round((136 * p.atp) / s.maxAtp), 2);
    this.atpText.setText(`${Math.floor(p.atp)}`);
    this.atpText.setPosition(x + 142, 60);
    this.floorText.setText(`${t('floor')} 1-${this.gs.floorIndex + 1}`);

    // indicador de habilidad (teclado)
    const gt = this.gs.gt;
    const cd = Math.max(0, p.skillReadyAt - gt);
    const ready = cd <= 0 && p.atp >= s.skillCost;
    if (!this.touchEnabled) {
      this.skillText.setVisible(true);
      const key = t('spaceKey');
      this.skillText.setText(`${key} ${L(p.cell.skill.short)} ${ready ? '' : cd > 0 ? `· ${(cd / 1000).toFixed(1)}s` : `· ${s.skillCost} ATP`}`);
      this.skillText.setColor(ready ? COLORS.blue : COLORS.textDim);
    } else this.skillText.setVisible(false);
  }

  drawMinimap() {
    const f = this.gs.floor;
    const g = this.mini;
    g.clear();
    const cw = 22;
    const ch = 14;
    const gap = 6;
    const ox = this.W - 14 - 5 * (cw + gap) + gap;
    const oy = 12;
    drawPanel(g, ox - 8, oy - 6, 5 * (cw + gap) - gap + 16, 5 * (ch + gap) - gap + 12, { alpha: 0.6 });
    const pos = (r) => [ox + r.gx * (cw + gap), oy + r.gy * (ch + gap)];
    // pasillos
    g.lineStyle(2, 0x8f3f4f, 1);
    for (const r of f.rooms) {
      if (!r.visited) continue;
      for (const id of r.links) {
        const o = f.rooms[id];
        const [ax, ay] = pos(r);
        const [bx, by] = pos(o);
        g.lineBetween(ax + cw / 2, ay + ch / 2, bx + cw / 2, by + ch / 2);
      }
    }
    for (const r of f.rooms) {
      if (!r.visited && !r.known) continue;
      const [x, y] = pos(r);
      const cur = r === this.gs.currentRoom;
      let fill = r.visited ? 0x6e2c3b : 0x2a0f1c;
      if (cur) fill = 0xc7787f;
      g.fillStyle(fill, 1);
      g.fillRect(x, y, cw, ch);
      g.lineStyle(1, r.visited ? 0xe0a0a3 : 0x6e2c3b, 1);
      g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      if (r.type === 'boss') {
        g.fillStyle(0xff3b3b, 1);
        g.fillRect(x + cw / 2 - 3, y + ch / 2 - 3, 6, 6);
      } else if (r.type === 'treasure') {
        g.fillStyle(0xffd166, 1);
        g.fillRect(x + cw / 2 - 2, y + ch / 2 - 2, 4, 4);
      }
      if (cur) {
        g.fillStyle(0xffffff, 1);
        g.fillRect(x + cw / 2 - 1, y + ch / 2 - 1, 2, 2);
      }
    }
    // botón de pausa (a la izquierda del minimapa)
    const px = this.pauseZone.x;
    const py = this.pauseZone.y;
    drawPanel(g, px, py, 40, 40, { alpha: 0.8 });
    g.fillStyle(0xf4d8e0, 1);
    g.fillRect(px + 13, py + 11, 5, 18);
    g.fillRect(px + 22, py + 11, 5, 18);
    if (Save.settings.debug) {
      // matraz de laboratorio
      const dx = this.debugZone.x;
      const dy = this.debugZone.y;
      drawPanel(g, dx, dy, 40, 40, { alpha: 0.8, border: 0x8ee0b0 });
      g.fillStyle(0x8ee0b0, 1);
      g.fillRect(dx + 17, dy + 9, 6, 9);
      g.fillTriangle(dx + 11, dy + 31, dx + 29, dy + 31, dx + 20, dy + 15);
      g.fillStyle(0x2a0f1c, 1);
      g.fillRect(dx + 15, dy + 7, 10, 3);
    }
  }

  drawBoss() {
    const b = this.gs.boss;
    const g = this.hud;
    if (!b || !b.active) {
      this.bossName.setText('');
      return;
    }
    const w = Math.min(420, this.W - 360);
    const x = this.W / 2 - w / 2;
    const y = this.H - 40;
    g.fillStyle(0x12060c, 0.85);
    g.fillRect(x - 4, y - 4, w + 8, 20);
    g.fillStyle(0x4a1020, 1);
    g.fillRect(x, y, w, 12);
    g.fillStyle(b.dmgTakenMult < 1 ? 0xa9b84e : 0xff3b3b, 1);
    g.fillRect(x, y, Math.max(0, (w * b.hp) / b.maxHp), 12);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(x, y, Math.max(0, (w * b.hp) / b.maxHp), 2);
    this.bossName.setText(L(ENEMIES[b.id].name));
  }

  drawTouch(dt) {
    const g = this.tg;
    g.clear();
    if (!this.touchEnabled || !this.gameRunning()) return;
    const p = this.gs.player;
    // stick izquierdo
    const m = this.touches.move;
    const baseX = m ? m.bx : 120;
    const baseY = m ? m.by : this.H - 110;
    g.fillStyle(0xffffff, m ? 0.12 : 0.06);
    g.fillCircle(baseX, baseY, 50);
    g.lineStyle(2, 0xffffff, m ? 0.3 : 0.15);
    g.strokeCircle(baseX, baseY, 50);
    let kx = baseX;
    let ky = baseY;
    if (m) {
      const dx = m.x - m.bx;
      const dy = m.y - m.by;
      const d = Math.hypot(dx, dy);
      const k = Math.min(1, 50 / Math.max(1, d));
      kx = m.bx + dx * k;
      ky = m.by + dy * k;
    }
    g.fillStyle(0xf4d8e0, m ? 0.55 : 0.25);
    g.fillCircle(kx, ky, 22);

    // botón / stick de ataque
    const A = this.btnAttack;
    const s = this.touches.aim;
    g.fillStyle(0xff8fb0, s ? 0.35 : 0.18);
    g.fillCircle(A.x, A.y, A.r);
    g.lineStyle(2, 0xff8fb0, 0.5);
    g.strokeCircle(A.x, A.y, A.r);
    g.fillStyle(0xffd0ea, 0.7);
    g.fillCircle(A.x, A.y, 8);
    if (s && Controls.touchAimActive && Save.settings.aim !== 'auto') {
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeCircle(s.bx, s.by, 40);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(s.bx + Controls.touchAimX * 30, s.by + Controls.touchAimY * 30, 14);
    }

    // botón de habilidad con su recarga
    const B = this.btnSkill;
    const gt = this.gs.gt;
    const cd = Math.max(0, p.skillReadyAt - gt);
    const ready = cd <= 0 && p.atp >= p.stats.skillCost;
    this.skillFlash = Math.max(0, (this.skillFlash || 0) - dt);
    g.fillStyle(0x9fc7ff, ready ? 0.35 : 0.12);
    g.fillCircle(B.x, B.y, B.r + (this.skillFlash ? 3 : 0));
    g.lineStyle(2, 0x9fc7ff, ready ? 0.8 : 0.3);
    g.strokeCircle(B.x, B.y, B.r);
    if (cd > 0) {
      const frac = cd / p.stats.skillCooldown;
      g.lineStyle(4, 0xffffff, 0.5);
      g.beginPath();
      g.arc(B.x, B.y, B.r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac), false);
      g.strokePath();
    }
    if (p.cell.skill.id === 'volley') {
      // icono de ráfaga de anticuerpos (Y en estrella)
      g.lineStyle(2, 0xffe46b, ready ? 0.95 : 0.4);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.lineBetween(B.x + Math.cos(a) * 5, B.y + Math.sin(a) * 5, B.x + Math.cos(a) * 15, B.y + Math.sin(a) * 15);
      }
      g.strokeCircle(B.x, B.y, 4);
      return;
    }
    if (p.cell.skill.id === 'clonal') {
      // icono de expansión clonal: una célula dividiéndose en dos
      g.lineStyle(2, 0x93c7ad, ready ? 0.95 : 0.4);
      g.strokeCircle(B.x - 7, B.y, 7);
      g.strokeCircle(B.x + 7, B.y, 7);
      g.fillStyle(0x93c7ad, ready ? 0.9 : 0.3);
      g.fillCircle(B.x - 7, B.y, 3);
      g.fillCircle(B.x + 7, B.y, 3);
      return;
    }
    if (p.cell.skill.id === 'synapse') {
      // icono de embestida: flecha doble
      g.lineStyle(3, 0xc9a0ff, ready ? 0.95 : 0.4);
      for (const ox of [-6, 3]) {
        g.lineBetween(B.x + ox - 6, B.y - 9, B.x + ox + 3, B.y);
        g.lineBetween(B.x + ox + 3, B.y, B.x + ox - 6, B.y + 9);
      }
      return;
    }
    if (p.cell.skill.id === 'm1') {
      // icono de activación: estallido de citocinas
      g.lineStyle(2, 0xffb27a, ready ? 0.95 : 0.4);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.lineBetween(B.x + Math.cos(a) * 7, B.y + Math.sin(a) * 7, B.x + Math.cos(a) * 15, B.y + Math.sin(a) * 15);
      }
      g.strokeCircle(B.x, B.y, 5);
      return;
    }
    // icono de red (NET)
    g.lineStyle(2, 0xdfe8ff, ready ? 0.9 : 0.4);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      g.lineBetween(B.x - Math.cos(a) * 14, B.y - Math.sin(a) * 14, B.x + Math.cos(a) * 14, B.y + Math.sin(a) * 14);
    }
    g.strokeCircle(B.x, B.y, 8);
  }

  // ---------------------------------------------------------------
  // Mensajes
  showBanner(title, sub = '') {
    this.bannerTitle.setText(title);
    this.bannerSub.setText(sub);
    this.tweens.killTweensOf([this.bannerTitle, this.bannerSub]);
    this.bannerTitle.setAlpha(0);
    this.bannerSub.setAlpha(0);
    this.tweens.add({ targets: [this.bannerTitle, this.bannerSub], alpha: 1, duration: 300, hold: 1800, yoyo: true });
  }

  showToast(text) {
    this.toast.setText(text);
    this.tweens.killTweensOf(this.toast);
    this.toast.setAlpha(0);
    this.tweens.add({ targets: this.toast, alpha: 1, duration: 200, hold: 900, yoyo: true });
  }

  showHint(text) {
    this.hint.setText(text);
    this.hint.setWordWrapWidth(this.W - 40);
    this.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(0);
    this.tweens.add({ targets: this.hint, alpha: 1, duration: 400, hold: 7000, yoyo: true });
  }

  nextDiscover() {
    const id = this.discoverQueue.shift();
    if (!id) {
      this.discBusy = false;
      return;
    }
    this.discBusy = true;
    const def = ENEMIES[id];
    this.discTitle.setText(t('newPathogen').toUpperCase());
    this.discName.setText(L(def.name));
    this.discBody.setText(L(def.summary));
    this.discIcon.setTexture(def.texture, 0);
    const h = 54 + this.discBody.height;
    this.discG.clear();
    drawPanel(this.discG, 0, 0, 340, h, { alpha: 0.9, border: COLORS.accent });
    this.discIcon.setPosition(306, Math.min(34, h / 2));
    this.disc.setAlpha(0);
    this.disc.x = -40;
    this.tweens.add({
      targets: this.disc,
      alpha: 1,
      x: 14,
      duration: 300,
      hold: 3600,
      yoyo: true,
      onComplete: () => this.nextDiscover(),
    });
  }
}
