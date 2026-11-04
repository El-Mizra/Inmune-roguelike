import Phaser from 'phaser';
import { generateFloor, TILE, SOLID } from '../systems/dungeon.js';
import { Player } from '../entities/Player.js';
import { CELLS, CELL_ORDER, isUnlocked } from '../data/cells.js';
import { Enemy } from '../entities/Enemy.js';
import { MRSABoss, MelanomaBoss } from '../entities/Bosses.js';
import { ENEMIES, FLOOR_POOLS, FLOOR_BOSSES, CODEX_PATHOGENS } from '../data/enemies.js';
import { UPGRADES, UPGRADE_IDS } from '../data/upgrades.js';
import { Controls } from '../systems/controls.js';
import { Save, memoryTier } from '../systems/storage.js';
import { t, lang, L } from '../systems/i18n.js';
import { Sfx } from '../systems/sfx.js';
import { PAL } from '../gfx/sprites.js';

const BURST_COLORS = {
  saureus: 0xefc24a,
  spyogenes: 0x8c5fd0,
  paeruginosa: 0x4fc0ad,
  calbicans: 0xecdcb6,
  hsv1: 0xd0567c,
  infected: 0xc56b9c,
  biofilm: 0xa9b84e,
  tumornode: 0x77421f,
  mrsa: 0xefc24a,
  melanoma: 0x3a2016,
};

// microbios lo bastante pequeños para ser fagocitados
const ENGULFABLE = new Set(['saureus', 'spyogenes', 'paeruginosa', 'calbicans', 'hsv1']);

export function newRun(cellId) {
  return {
    cellId,
    floor: 0,
    upgrades: [],
    hp: null,
    atp: null,
    kills: {},
    elapsed: 0,
    seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0,
  };
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.run = data.run;
  }

  create() {
    this.gt = 0;
    this.lang = lang();
    this.floorIndex = this.run.floor;
    this.hpMult = 1 + this.floorIndex * 0.3;
    this.floor = generateFloor(this.run.seed + this.floorIndex * 7919, this.floorIndex);
    this.currentRoom = this.floor.start;
    this.activeRoom = null;
    this.boss = null;
    this.ending = false;
    this.hostCells = [];
    this.nets = [];
    this.mouseFire = false;
    this.queueSkill = false;
    this.lastMove = new Phaser.Math.Vector2(1, 0);
    Controls.reset();

    // --- mapa ---
    const map = this.make.tilemap({ data: this.floor.tiles, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    this.layer = map.createLayer(0, ts, 0, 0);
    this.layer.setCollision(SOLID);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // --- grupos ---
    this.enemies = this.physics.add.group();
    this.playerBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, defaultKey: 'granule', maxSize: 140 });
    this.enemyBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, defaultKey: 'toxin', maxSize: 320 });
    this.doors = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();

    // --- jugador ---
    const s = this.floor.start;
    this.player = new Player(this, (s.cx + 0.5) * TILE, (s.cy + 0.5) * TILE, this.run);
    s.visited = true;
    s.cleared = true;
    for (const id of s.links) this.floor.rooms[id].known = true;

    // --- colisiones ---
    const killB = (b) => this.killBullet(b);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.player, this.doors);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.enemies, this.doors);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.collider(this.playerBullets, this.layer, killB);
    this.physics.add.collider(this.playerBullets, this.doors, killB);
    this.physics.add.collider(this.enemyBullets, this.layer, killB);
    this.physics.add.collider(this.enemyBullets, this.doors, killB);
    this.physics.add.overlap(this.playerBullets, this.enemies, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, (p, b) => {
      if (!b.active) return;
      p.hurt(this.gt, b.damage || 1);
      this.killBullet(b);
    });
    this.physics.add.overlap(this.player, this.enemies, (p, e) => {
      if (e.active && e.def.contactDamage) p.hurt(this.gt, e.def.contactDamage);
    });
    this.physics.add.overlap(this.player, this.pickups, (_p, item) => this.collect(item));

    // --- cámara ---
    const cam = this.cameras.main;
    cam.setBackgroundColor(PAL.void);
    cam.setZoom(2);
    cam.setRoundPixels(true);
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.18, 0.18);
    cam.fadeIn(400, 18, 6, 12);

    this.aimG = this.add.graphics().setDepth(20);
    this.shadowG = this.add.graphics().setDepth(2);
    this.podG = this.add.graphics().setDepth(9);
    this.allies = [];
    this.scatterDecor();
    // partículas ambientales: proteínas y citocinas flotando en el líquido intersticial
    this.ambient = this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: map.widthInPixels },
      y: { min: 0, max: map.heightInPixels },
      lifespan: 6000,
      speedX: { min: -6, max: 6 },
      speedY: { min: -4, max: 4 },
      scale: { min: 0.4, max: 0.9 },
      alpha: { values: [0, 0.4, 0.4, 0] },
      tint: [0xf4d8e0, 0xc7787f, 0xffd166],
      frequency: 60,
      quantity: 1,
    }).setDepth(15);

    // --- entrada (teclado y ratón) ---
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ESC,J,K,E,P');
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p) => {
      if (p.wasTouch) return;
      Sfx.unlock();
      if (p.rightButtonDown()) this.queueSkill = true;
      else this.mouseFire = true;
    });
    this.input.on('pointerup', (p) => {
      if (p.wasTouch) return;
      if (!p.leftButtonDown()) this.mouseFire = false;
    });

    // pausa automática al perder el foco (útil en móvil)
    const onBlur = () => this.openPause();
    this.game.events.on('blur', onBlur);
    this.events.once('shutdown', () => this.game.events.off('blur', onBlur));

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    else this.scene.get('UI').events.emit('floorchanged');
    this.time.delayedCall(250, () => {
      this.events.emit('banner', `${t('zone')} 1-${this.floorIndex + 1}`, t('zone1'));
      if (this.floorIndex === 0) this.events.emit('hint', Save.isTouch ? t('controlsTouch') : t('controlsPc'));
    });
  }

  // ------------------------------------------------------------------
  update(_time, delta) {
    const dt = Math.min(delta, 50);
    this.gt += dt;
    this.run.elapsed += dt;
    const p = this.player;

    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) || Phaser.Input.Keyboard.JustDown(this.keys.P) || Controls.pauseQueued) {
      Controls.pauseQueued = false;
      this.openPause();
      return;
    }

    if (!p.dead) this.handleInput(dt);
    p.tick(this.gt, dt);
    this.updateSynapse();
    this.updateAllies();

    for (const e of this.enemies.getChildren().slice()) if (e.active) e.tick(dt);

    for (const b of this.playerBullets.getChildren()) if (b.active && this.gt >= b.dieAt) this.killBullet(b, false);
    for (const b of this.enemyBullets.getChildren()) if (b.active && this.gt >= b.dieAt) this.killBullet(b, false);

    this.updateNets();
    this.updatePickups(dt);
    this.drawShadows();
    this.updateRooms();
  }

  handleInput() {
    const p = this.player;
    const k = this.keys;
    let mx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0) + Controls.touchMoveX;
    let my = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0) + Controls.touchMoveY;
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    p.setVelocity(mx * p.stats.speed, my * p.stats.speed);
    if (this.gt < p.dashUntil) p.setVelocity(p.dashVX, p.dashVY);
    if (len > 0.1) {
      this.lastMove.set(mx, my).normalize();
      const w = Math.sin(this.gt * 0.02) * 0.06;
      p.setScale(1 + w, 1 - w);
    } else p.setScale(1);

    // --- apuntado ---
    const mode = Save.settings.aim;
    const touchFiring = Controls.touchFire;
    let dir = null;
    let wantFire = false;
    if (touchFiring) {
      wantFire = true;
      if (mode !== 'auto' && Controls.touchAimActive) dir = new Phaser.Math.Vector2(Controls.touchAimX, Controls.touchAimY);
    } else {
      wantFire = this.mouseFire || k.J.isDown;
      const ptr = this.input.activePointer;
      if (mode !== 'auto' && !ptr.wasTouch) {
        const wp = ptr.positionToCamera(this.cameras.main);
        dir = new Phaser.Math.Vector2(wp.x - p.x, wp.y - p.y);
      }
    }
    let target = null;
    if (mode === 'auto' || !dir) {
      target = this.nearestTarget(p.targetRange);
      if (target) dir = new Phaser.Math.Vector2(target.x - p.x, target.y - p.y);
      else if (!dir) dir = this.lastMove.clone();
    } else if (mode === 'assist') {
      target = this.targetInCone(dir, 0.32, p.targetRange);
      if (target) dir = new Phaser.Math.Vector2(target.x - p.x, target.y - p.y);
    }
    if (dir.lengthSq() > 0) dir.normalize();
    else dir.set(1, 0);
    p.aim.copy(dir);
    this.drawAim(dir, target);

    if (wantFire && p.canFire(this.gt)) p.fire(this.gt, dir.x, dir.y);

    if (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.K) || Phaser.Input.Keyboard.JustDown(k.E) || this.queueSkill || Controls.skillQueued) {
      this.queueSkill = false;
      Controls.skillQueued = false;
      if (!p.useSkill(this.gt)) this.floatText(p.x, p.y - 14, 'ATP', '#ffe46b');
    }
  }

  drawAim(dir, target) {
    const p = this.player;
    const g = this.aimG;
    g.clear();
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(Math.round(p.x + dir.x * 13) - 1, Math.round(p.y + dir.y * 13) - 1, 2, 2);
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(Math.round(p.x + dir.x * 18), Math.round(p.y + dir.y * 18), 1, 1);
    if (target) {
      const r = (target.radius || 6) + 4;
      g.lineStyle(1, 0xffd166, 0.9);
      const x = Math.round(target.x);
      const y = Math.round(target.y);
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ]) {
        g.lineBetween(x + sx * r, y + sy * r, x + sx * (r - 3), y + sy * r);
        g.lineBetween(x + sx * r, y + sy * r, x + sx * r, y + sy * (r - 3));
      }
    }
  }

  targetsInRange(range) {
    const p = this.player;
    const room = this.activeRoom;
    return this.enemies.getChildren().filter((e) => {
      if (!e.active || e.dying || (e.stealth && !this.player.cell.seesStealth)) return false;
      if (room && e.room !== room) return false;
      return Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) <= range;
    });
  }

  nearestTarget(range) {
    const p = this.player;
    let best = null;
    let bd = Infinity;
    for (const e of this.targetsInRange(range)) {
      // prioriza enemigos reales sobre partes del jefe
      const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) + (e.countsForClear ? 0 : 40);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  targetInCone(dir, maxAngle, range) {
    const p = this.player;
    const base = Math.atan2(dir.y, dir.x);
    let best = null;
    let bs = Infinity;
    for (const e of this.targetsInRange(range)) {
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      const diff = Math.abs(Phaser.Math.Angle.Wrap(a - base));
      if (diff > maxAngle) continue;
      const score = diff * 200 + Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y);
      if (score < bs) {
        bs = score;
        best = e;
      }
    }
    return best;
  }

  // ------------------------------------------------------------------
  // Proyectiles
  firePlayerBullet(x, y, ang, { speed, damage, pierce, life, texture = 'granule', opsonize = false, neutralize = null }) {
    const b = this.playerBullets.get(x, y, texture);
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setTexture(texture);
    b.setDepth(9);
    b.body.setCircle(2.5, b.width / 2 - 2.5, b.height / 2 - 2.5);
    b.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
    b.damage = damage;
    b.pierce = pierce;
    b.dieAt = this.gt + life;
    b.hits = new Set();
    b.opsonize = opsonize;
    b.neutralize = neutralize;
    b.setRotation(texture === 'antibody' ? ang + Math.PI / 2 : 0);
  }

  fireEnemyBullet(x, y, ang, texture, speed, damage = 1) {
    const b = this.enemyBullets.get(x, y, texture);
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setTexture(texture);
    b.setDepth(9);
    const r = Math.min(b.width, b.height) / 2 - 1;
    b.body.setCircle(r, b.width / 2 - r, b.height / 2 - r);
    b.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
    b.damage = damage;
    b.dieAt = this.gt + 7000;
  }

  killBullet(b, puff = true) {
    if (!b.active) return;
    if (puff) this.puff(b.x, b.y, b.texture.key === 'granule' ? 0xffd0ea : 0xffffff);
    b.disableBody(true, true);
  }

  onBulletHit(b, e) {
    if (!b.active || !e.active || e.dying || b.hits.has(e)) return;
    b.hits.add(e);
    let dmg = b.damage * this.player.damageMultiplier(e.def, e.id);
    // la célula NK ignora el camuflaje por pérdida de MHC-I
    if (e.stealth && this.player.cell.seesStealth) dmg /= e.dmgTakenMult;
    // anticuerpos: neutralizan virus libres y marcan (opsonizan) al resto
    if (b.neutralize && b.neutralize.includes(e.id)) dmg = Math.max(dmg, e.hp + 1);
    if (b.opsonize && !e.def.boss) e.opsonize(4000);
    else if (b.opsonize) e.opsonize(1500);
    e.takeDamage(dmg, 'shot');
    if (b.pierce > 0) b.pierce -= 1;
    else this.killBullet(b);
  }

  // ------------------------------------------------------------------
  // Macrófago: zarpazo con pseudópodos (fagocitosis)
  meleeSwing(x, y, ang, { reach, arc, damage }) {
    const g = this.add.graphics().setDepth(11);
    g.fillStyle(0xd4b08e, 0.55);
    g.slice(x, y, reach, ang - arc / 2, ang + arc / 2, false);
    g.fillPath();
    g.lineStyle(2, 0xecd0ad, 0.9);
    g.beginPath();
    g.arc(x, y, reach, ang - arc / 2, ang + arc / 2, false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });
    Sfx.swing();

    const inArc = (ox, oy, extra = 0) => {
      const d = Phaser.Math.Distance.Between(x, y, ox, oy);
      if (d > reach + extra) return false;
      if (d < 6) return true;
      return Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(oy - y, ox - x) - ang)) <= arc / 2;
    };
    // los proyectiles enemigos también se engullen
    for (const b of this.enemyBullets.getChildren()) if (b.active && inArc(b.x, b.y, 3)) this.killBullet(b);

    const p = this.player;
    for (const e of this.enemies.getChildren().slice()) {
      if (!e.active || e.dying || !inArc(e.x, e.y, e.radius)) continue;
      const dmg = damage * p.damageMultiplier(e.def, e.id);
      const engulfable = ENGULFABLE.has(e.id) && !e.isHypha;
      const willDie = e.hp - dmg <= 0;
      e.takeDamage(dmg, 'melee');
      if (engulfable && willDie) {
        p.addAtp(3);
        if (Math.random() < 0.35) this.floatText(e.x, e.y - 8, t('phagocytosed'), '#ecd0ad');
      }
    }
  }

  // Célula NK: embestida con sinapsis letal
  startSynapse(dx, dy) {
    const p = this.player;
    const speed = 380;
    p.dashUntil = this.gt + p.stats.skillDuration;
    p.dashVX = dx * speed;
    p.dashVY = dy * speed;
    p.invulnUntil = Math.max(p.invulnUntil, this.gt + p.stats.skillDuration + 120);
    p.dashHits = new Set();
    p.nextGhost = 0;
    this.floatText(p.x, p.y - 14, this.lang === 'es' ? 'Granzimas' : 'Granzymes', '#c9a0ff');
  }

  updateSynapse() {
    const p = this.player;
    if (!(this.gt < p.dashUntil)) return;
    if (this.gt >= p.nextGhost) {
      p.nextGhost = this.gt + 35;
      const ghost = this.add.image(p.x, p.y, p.texture.key, p.frame.name).setDepth(9).setAlpha(0.5).setTint(0xb48cff);
      this.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
    }
    const base = p.cell.skill.damage;
    for (const e of this.enemies.getChildren().slice()) {
      if (!e.active || e.dying || p.dashHits.has(e)) continue;
      if (Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) > e.radius + 11) continue;
      p.dashHits.add(e);
      let dmg = base * p.damageMultiplier(e.def, e.id);
      if (e.stealth) dmg /= e.dmgTakenMult;
      e.takeDamage(dmg, 'synapse');
      this.burstFx(e.x, e.y, 0xc9a0ff, 6);
    }
  }

  // Linfocito T CD8: expansión clonal (aliados temporales)
  spawnClones(n, duration) {
    const p = this.player;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random();
      const c = this.physics.add.sprite(p.x + Math.cos(a) * 10, p.y + Math.sin(a) * 10, 'tcell', 0).setDepth(9);
      c.play('tcell_idle');
      c.setTint(0xd8ffe8);
      c.body.setCircle(4, 3, 3);
      c.until = this.gt + duration;
      c.nextHit = 0;
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 0.85, duration: 250, ease: 'Back.easeOut' });
      this.physics.add.collider(c, this.layer);
      this.physics.add.collider(c, this.doors);
      this.allies.push(c);
    }
    this.floatText(p.x, p.y - 16, this.lang === 'es' ? 'Expansión clonal' : 'Clonal expansion', '#93c7ad');
  }

  updateAllies() {
    if (!this.allies.length) return;
    const p = this.player;
    for (const c of this.allies) {
      if (this.gt >= c.until || p.dead) {
        c.done = true;
        c.body.enable = false;
        this.tweens.add({ targets: c, alpha: 0, scale: 0, duration: 250, onComplete: () => c.destroy() });
        continue;
      }
      // busca el enemigo más cercano a él
      let best = null;
      let bd = 170;
      for (const e of this.enemies.getChildren()) {
        if (!e.active || e.dying || (this.activeRoom && e.room !== this.activeRoom)) continue;
        const d = Phaser.Math.Distance.Between(c.x, c.y, e.x, e.y);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      if (best) {
        if (bd > best.radius + 5) this.physics.moveToObject(c, best, 105);
        else c.setVelocity(0, 0);
        if (bd <= best.radius + 7 && this.gt >= c.nextHit) {
          c.nextHit = this.gt + 420;
          best.takeDamage(2.5 * p.damageMultiplier(best.def, best.id), 'ally');
        }
      } else if (Phaser.Math.Distance.Between(c.x, c.y, p.x, p.y) > 22) this.physics.moveToObject(c, p, 100);
      else c.setVelocity(0, 0);
    }
    this.allies = this.allies.filter((c) => !c.done);
  }

  // Macrófago: onda de TNF-α al activarse (M1)
  cytokinePulse(x, y, radius) {
    const ring = this.add.circle(x, y, 4).setStrokeStyle(3, 0xffb27a, 0.9).setDepth(11);
    this.tweens.add({ targets: ring, radius, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
    this.floatText(x, y - 18, 'TNF-α', '#ffb27a');
    this.cameras.main.shake(120, 0.004);
    for (const e of this.enemies.getChildren().slice()) {
      if (!e.active || e.dying) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d > radius + e.radius) continue;
      if (!e.def.boss && !e.body.immovable) {
        const a = Math.atan2(e.y - y, e.x - x);
        e.setVelocity(Math.cos(a) * 260, Math.sin(a) * 260);
        e.knockUntil = this.gt + 350;
      }
      e.takeDamage(2 * this.player.damageMultiplier(e.def, e.id), 'melee');
    }
  }

  // ------------------------------------------------------------------
  // NET: trampa extracelular de neutrófilo
  castNet(x, y, radius, duration) {
    const g = this.add.graphics().setDepth(7);
    const pts = [];
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * radius;
      pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]);
    }
    g.fillStyle(0x9fc7ff, 0.1);
    g.fillCircle(x, y, radius);
    g.lineStyle(1, 0xdfe8ff, 0.75);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Phaser.Math.Distance.Between(pts[i][0], pts[i][1], pts[j][0], pts[j][1]);
        if (d < radius * 0.55) g.lineBetween(pts[i][0], pts[i][1], pts[j][0], pts[j][1]);
      }
    }
    g.fillStyle(0xc76a9a, 1);
    for (const [px, py] of pts) g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 180 });
    this.nets.push({ x, y, r: radius, until: this.gt + duration, nextTick: this.gt, g });
    this.floatText(x, y - radius * 0.6, 'NET', '#dfe8ff');
  }

  updateNets() {
    for (const n of this.nets) {
      if (this.gt >= n.until) {
        n.done = true;
        this.tweens.add({ targets: n.g, alpha: 0, duration: 300, onComplete: () => n.g.destroy() });
        continue;
      }
      const tick = this.gt >= n.nextTick;
      if (tick) n.nextTick += 300;
      for (const e of this.enemies.getChildren()) {
        if (!e.active || e.dying) continue;
        if (Phaser.Math.Distance.Between(n.x, n.y, e.x, e.y) > n.r + e.radius) continue;
        if (!e.def.boss) {
          e.slowUntil = this.gt + 150;
          e.slowFactor = 0.25;
        }
        if (tick) e.takeDamage(1.4 * this.player.damageMultiplier(e.def, e.id), 'net');
      }
    }
    this.nets = this.nets.filter((n) => !n.done);
  }

  // ------------------------------------------------------------------
  // Enemigos
  spawnEnemy(id, x, y, room, opts = {}) {
    let e;
    if (id === 'mrsa') e = new MRSABoss(this, x, y, room);
    else if (id === 'melanoma') e = new MelanomaBoss(this, x, y, room);
    else e = new Enemy(this, x, y, id, room, opts);
    if (CODEX_PATHOGENS.includes(id) && Save.discover(id)) this.events.emit('discover', id);
    return e;
  }

  roomEnemyCount(room) {
    let n = 0;
    for (const e of this.enemies.getChildren()) if (e.active && !e.dying && e.room === room && e.countsForClear) n++;
    return n;
  }

  onEnemyKilled(e, silent) {
    this.burstFx(e.x, e.y, BURST_COLORS[e.id] || 0xffffff, e.def.boss ? 40 : 10);
    if (!silent) Sfx.kill();
    if (e === this.boss) this.boss = null;
    if (silent || e.noReward) return;
    this.run.kills[e.id] = (this.run.kills[e.id] || 0) + 1;
    const r = Math.random();
    if (r < 0.07) this.dropPickup('glucose', e.x, e.y);
    else if (r < 0.095) this.dropPickup('heal', e.x, e.y);
  }

  telegraph(x, y, cb, room) {
    room.pending = (room.pending || 0) + 1;
    const s = this.add.sprite(x, y, 'spawn').play('spawn_blink').setDepth(3);
    this.time.delayedCall(750, () => {
      s.destroy();
      room.pending -= 1;
      if (!this.ending && room.active) cb();
    });
  }

  randomSpawnPoint(room, minDist = 70) {
    const p = this.player;
    for (let i = 0; i < 60; i++) {
      const tx = Phaser.Math.Between(room.x + 2, room.x + room.w - 3);
      const ty = Phaser.Math.Between(room.y + 2, room.y + room.h - 3);
      let ok = true;
      for (let oy = -1; oy <= 1 && ok; oy++) for (let ox = -1; ox <= 1 && ok; ox++) if (!this.floor.isFloor(tx + ox, ty + oy)) ok = false;
      if (!ok) continue;
      const x = (tx + 0.5) * TILE;
      const y = (ty + 0.5) * TILE;
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < minDist && i < 50) continue;
      return { x, y };
    }
    return { x: (room.cx + 0.5) * TILE, y: (room.cy + 0.5) * TILE };
  }

  unstick(e) {
    const tx = Math.floor(e.x / TILE);
    const ty = Math.floor(e.y / TILE);
    const r = e.room;
    const inside = tx > r.x && tx < r.x + r.w - 1 && ty > r.y && ty < r.y + r.h - 1;
    if (inside && this.floor.isFloor(tx, ty)) return;
    // busca el tile de suelo libre más cercano dentro de la sala
    for (let rad = 0; rad < 6; rad++) {
      for (let oy = -rad; oy <= rad; oy++) {
        for (let ox = -rad; ox <= rad; ox++) {
          const x = Phaser.Math.Clamp(tx + ox, r.x + 1, r.x + r.w - 2);
          const y = Phaser.Math.Clamp(ty + oy, r.y + 1, r.y + r.h - 2);
          if (this.floor.isFloor(x, y)) {
            e.body.reset((x + 0.5) * TILE, (y + 0.5) * TILE);
            return;
          }
        }
      }
    }
  }

  clampToRoom(room, x, y) {
    const minX = (room.x + 2) * TILE;
    const maxX = (room.x + room.w - 2) * TILE;
    const minY = (room.y + 2) * TILE;
    const maxY = (room.y + room.h - 2) * TILE;
    return new Phaser.Math.Vector2(Phaser.Math.Clamp(x, minX, maxX), Phaser.Math.Clamp(y, minY, maxY));
  }

  pickSpecies() {
    const pool = FLOOR_POOLS[Math.min(this.floorIndex, FLOOR_POOLS.length - 1)];
    const total = pool.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    for (const [id, w] of pool) {
      r -= w;
      if (r <= 0) return id;
    }
    return pool[0][0];
  }

  spawnGroup(id, room) {
    const pt = this.randomSpawnPoint(room);
    const def = ENEMIES[id];
    if (id === 'saureus') {
      for (let i = 0; i < 2; i++) {
        const x = pt.x + (i ? 7 : -7);
        this.telegraph(x, pt.y, () => this.spawnEnemy(id, x, pt.y, room), room);
      }
    } else if (id === 'spyogenes') {
      // la cadena se extiende hacia el centro de la sala para no quedar dentro de un muro
      const dirX = pt.x < (room.cx + 0.5) * TILE ? 1 : -1;
      this.telegraph(pt.x, pt.y, () => {
        let prev = null;
        for (let i = 0; i < def.chain; i++) {
          prev = this.spawnEnemy(id, pt.x + dirX * i * 6, pt.y, room, { leader: prev });
        }
      }, room);
    } else if (id === 'hsv1') {
      this.ensureHostCells(room, 4);
      for (let i = 0; i < def.group; i++) {
        const x = pt.x + (i - 1) * 8;
        this.telegraph(x, pt.y, () => this.spawnEnemy(id, x, pt.y, room), room);
      }
    } else {
      this.telegraph(pt.x, pt.y, () => this.spawnEnemy(id, pt.x, pt.y, room), room);
    }
  }

  // ------------------------------------------------------------------
  // Células del huésped (queratinocitos sanos)
  ensureHostCells(room, n) {
    const alive = this.hostCells.filter((c) => c.active && !c.infected && c.room === room).length;
    for (let i = alive; i < n; i++) {
      const pt = this.randomSpawnPoint(room, 40);
      const c = this.add.image(pt.x, pt.y, 'kera').setDepth(6);
      c.room = room;
      c.infected = false;
      c.shield = this.player.stats.cellShield;
      if (c.shield) c.setTint(0xb8d0ff);
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 300 });
      this.hostCells.push(c);
      room.hadHostCells = true;
    }
  }

  nearestHostCell(virion) {
    let best = null;
    let bd = Infinity;
    for (const c of this.hostCells) {
      if (!c.active || c.infected || c.room !== virion.room) continue;
      const d = Phaser.Math.Distance.Between(c.x, c.y, virion.x, virion.y);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    return best;
  }

  infectHostCell(cell, virion) {
    if (!cell.active || cell.infected || virion.dying) return;
    if (cell.shield > 0) {
      cell.shield -= 1;
      if (!cell.shield) cell.clearTint();
      this.floatText(cell.x, cell.y - 10, 'IFN', '#b8d0ff');
      virion.die(true);
      return;
    }
    cell.infected = true;
    const { x, y, room } = cell;
    cell.destroy();
    virion.die(true);
    this.spawnEnemy('infected', x, y, room);
  }

  // ------------------------------------------------------------------
  // Salas
  updateRooms() {
    const p = this.player;
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    const room = this.floor.roomAt(tx, ty, 1);
    if (room && room !== this.currentRoom) this.enterRoom(room);
    if (room) this.currentRoom = room;
    const r = this.activeRoom;
    if (r && !r.betweenWaves && (r.pending || 0) === 0 && this.roomEnemyCount(r) === 0) {
      if (r.waveIndex < r.waves) {
        r.betweenWaves = true;
        this.time.delayedCall(600, () => {
          r.betweenWaves = false;
          if (r.active) this.spawnWave(r);
        });
      } else if (r.type !== 'boss' || r.bossSpawned) this.clearRoom(r);
    }
  }

  enterRoom(room) {
    room.visited = true;
    for (const id of room.links) this.floor.rooms[id].known = true;
    if (room.cleared || room.active) return;
    if (room.type === 'combat') this.startCombat(room);
    else if (room.type === 'boss') this.startBoss(room);
    else if (room.type === 'treasure' && !room.claimed) {
      room.claimed = true;
      room.cleared = true;
      this.time.delayedCall(300, () => this.offerUpgrades());
    } else room.cleared = true;
  }

  closeDoors(room) {
    room.doorSprites = room.doors.map((d) => {
      const s = this.doors.create((d.x + 0.5) * TILE, (d.y + 0.5) * TILE, 'door', 0);
      s.setDepth(4).setAlpha(0);
      this.tweens.add({ targets: s, alpha: 1, duration: 200 });
      return s;
    });
    Sfx.door();
  }

  openDoors(room) {
    for (const s of room.doorSprites || []) {
      s.body.enable = false;
      this.tweens.add({ targets: s, alpha: 0, duration: 250, onComplete: () => s.destroy() });
    }
    room.doorSprites = [];
    Sfx.door();
  }

  startCombat(room) {
    room.active = true;
    this.activeRoom = room;
    room.waves = this.floorIndex === 0 ? 2 : 3;
    room.waveIndex = 0;
    room.pending = 0;
    this.closeDoors(room);
    this.spawnWave(room);
  }

  spawnWave(room) {
    room.waveIndex += 1;
    let budget = 4 + this.floorIndex * 2 + Math.min(room.depth, 4) + (room.waveIndex - 1);
    let guard = 0;
    while (budget > 0 && guard++ < 20) {
      const id = this.pickSpecies();
      const cost = ENEMIES[id].cost;
      if (cost > budget + 1) continue;
      budget -= cost;
      this.spawnGroup(id, room);
    }
  }

  startBoss(room) {
    room.active = true;
    this.activeRoom = room;
    room.waves = 1;
    room.waveIndex = 1;
    room.pending = 1;
    this.closeDoors(room);
    Sfx.boss();
    const id = FLOOR_BOSSES[Math.min(this.floorIndex, FLOOR_BOSSES.length - 1)];
    this.events.emit('banner', t('bossIncoming'), L(ENEMIES[id].name));
    this.cameras.main.shake(400, 0.004);
    const x = (room.cx + 0.5) * TILE;
    const y = (room.cy - 2 + 0.5) * TILE;
    const s = this.add.sprite(x, y, 'spawn').play('spawn_blink').setDepth(3).setScale(3);
    this.time.delayedCall(1500, () => {
      s.destroy();
      if (this.ending) return;
      this.boss = this.spawnEnemy(id, x, y, room);
      room.bossSpawned = true;
      room.pending = 0;
    });
  }

  clearRoom(room) {
    room.active = false;
    room.cleared = true;
    this.activeRoom = null;
    this.openDoors(room);
    Sfx.clear();
    const p = this.player;
    this.events.emit('toast', t('roomCleared'));
    this.dropPickup('glucose', p.x + 14, p.y - 6);
    if (Math.random() < 0.3) this.dropPickup('heal', p.x - 14, p.y - 6);
    if (room.hadHostCells) {
      const saved = this.hostCells.filter((c) => c.active && !c.infected && c.room === room).length;
      if (saved > 0) {
        this.floatText(p.x, p.y - 20, `${t('tissueSaved')} ×${saved}`, '#8ee0b0');
        this.dropPickup('heal', p.x, p.y + 14);
      }
    }
    if (room.type === 'boss') this.onBossRoomCleared(room);
  }

  onBossRoomCleared(room) {
    // limpia proyectiles enemigos
    for (const b of this.enemyBullets.getChildren()) if (b.active) this.killBullet(b, false);
    const x = (room.cx + 0.5) * TILE;
    const y = (room.cy + 0.5) * TILE;
    this.time.delayedCall(900, () => {
      const portal = this.physics.add.sprite(x, y, 'portal', 0).setDepth(3).play('portal_spin');
      portal.body.setCircle(8, 4, 4);
      portal.body.setImmovable(true);
      this.floatText(x, y - 22, t('portal'), '#8ee0e0', 4000);
      let used = false;
      this.physics.add.overlap(this.player, portal, () => {
        if (used || this.ending) return;
        used = true;
        this.nextFloor();
      });
      this.offerUpgrades();
    });
  }

  // ------------------------------------------------------------------
  // Objetos
  dropPickup(type, x, y) {
    const it = this.physics.add.sprite(x, y, type, 0).setDepth(6);
    it.play(`${type}_idle`);
    it.kind = type;
    it.body.setCircle(4, 0.5, 0.5);
    it.setScale(0);
    this.tweens.add({ targets: it, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.pickups.add(it);
  }

  updatePickups() {
    const p = this.player;
    for (const it of this.pickups.getChildren()) {
      if (!it.active) continue;
      const d = Phaser.Math.Distance.Between(it.x, it.y, p.x, p.y);
      if (d < 52) this.physics.moveToObject(it, p, 150);
      else it.setVelocity(0, 0);
    }
  }

  collect(it) {
    if (!it.active || it.collected) return;
    it.collected = true;
    const p = this.player;
    if (it.kind === 'glucose') {
      p.addAtp(35);
      this.floatText(p.x, p.y - 14, '+ATP', '#ffe46b');
    } else if (it.kind === 'heal') {
      if (p.hp >= p.stats.maxHp) {
        p.armor = p.stats.maxArmor;
        this.floatText(p.x, p.y - 14, `+${t('armor')}`, '#b8c6e8');
      } else {
        p.heal(1);
        this.floatText(p.x, p.y - 14, '+1', '#ff8fb0');
      }
    }
    Sfx.pickup();
    it.destroy();
  }

  offerUpgrades() {
    if (this.ending) return;
    const taken = new Set(this.run.upgrades);
    const weaponType = this.player.cell.weapon.type;
    const fits = (id) => !UPGRADES[id].only || UPGRADES[id].only === weaponType;
    let pool = UPGRADE_IDS.filter((id) => !taken.has(id) && fits(id));
    if (pool.length < 3) pool = UPGRADE_IDS.filter(fits);
    Phaser.Utils.Array.Shuffle(pool);
    const options = pool.slice(0, 3);
    for (const id of options) Save.discover(`up_${id}`);
    this.mouseFire = false;
    this.scene.pause();
    this.scene.launch('Choice', {
      options,
      onPick: (id) => {
        this.player.addUpgrade(id);
        this.scene.resume('Game');
      },
    });
  }

  openPause() {
    if (this.ending || !this.scene.isActive('Game') || this.scene.isActive('Choice') || this.scene.isActive('Pause')) return;
    this.mouseFire = false;
    Controls.reset();
    this.scene.pause();
    this.scene.launch('Pause');
  }

  // ------------------------------------------------------------------
  // Progresión
  nextFloor() {
    this.ending = true;
    this.run.floor += 1;
    this.run.hp = this.player.hp;
    this.run.atp = this.player.atp;
    if (this.run.floor >= FLOOR_BOSSES.length) {
      this.finishRun(true);
      return;
    }
    this.cameras.main.fadeOut(500, 18, 6, 12);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ run: this.run }));
  }

  onPlayerDeath() {
    if (this.ending) return;
    this.ending = true;
    const p = this.player;
    this.burstFx(p.x, p.y, 0xdcb4c8, 30);
    this.tweens.add({ targets: p, scale: 0, alpha: 0, duration: 600 });
    this.time.delayedCall(1400, () => this.finishRun(false));
  }

  finishRun(won) {
    const lockedBefore = CELL_ORDER.filter((id) => CELLS[id].playable && !isUnlocked(id));
    const summary = Object.entries(this.run.kills).map(([id, n]) => {
      const before = memoryTier(id);
      return { id, n, before };
    });
    Save.addKills(this.run.kills);
    for (const s of summary) s.after = memoryTier(s.id);
    Save.endRun(won);
    const unlocked = lockedBefore.filter((id) => isUnlocked(id));
    const data = { won, time: this.run.elapsed, kills: summary, floor: this.run.floor, upgrades: this.run.upgrades.slice(), unlocked };
    this.cameras.main.fadeOut(500, 18, 6, 12);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UI');
      this.scene.start('Result', data);
    });
  }

  // ------------------------------------------------------------------
  // Efectos
  // Decoración del tejido: se dibuja una sola vez, sin colisiones.
  scatterDecor() {
    const f = this.floor;
    for (const r of f.rooms) {
      const n = Math.floor((r.w * r.h) / 40);
      for (let i = 0; i < n; i++) {
        const tx = Phaser.Math.Between(r.x + 2, r.x + r.w - 3);
        const ty = Phaser.Math.Between(r.y + 2, r.y + r.h - 3);
        if (!f.isFloor(tx, ty)) continue;
        const frame = Phaser.Math.Between(0, 5);
        this.add
          .image((tx + 0.5) * TILE, (ty + 0.5) * TILE, 'decor', frame)
          .setDepth(1)
          .setAlpha(0.75)
          .setAngle(frame === 2 || frame === 3 ? Phaser.Math.RND.pick([0, 90]) : Phaser.Math.Between(-20, 20));
      }
    }
  }

  // Sombras bajo las células para que "floten" sobre el tejido.
  drawShadows() {
    const g = this.shadowG;
    g.clear();
    g.fillStyle(0x000000, 0.28);
    const p = this.player;
    if (p.active && !p.dead) g.fillEllipse(p.x, p.y + 7, 13, 4);
    // movimiento ameboide: el borde frontal (lamelipodio) se estira hacia donde avanza
    const pg = this.podG;
    pg.clear();
    const v = p.body.velocity;
    const sp = Math.hypot(v.x, v.y);
    if (p.active && !p.dead && sp > 10) {
      const dx = v.x / sp;
      const dy = v.y / sp;
      const pulse = 0.6 + 0.4 * Math.sin(this.gt * 0.018);
      const r = (p.cell.bodyRadius || 5) + 1;
      pg.fillStyle(0x1a0710, p.alpha);
      pg.fillCircle(p.x + dx * r * pulse, p.y + dy * r * pulse, r * 0.55 + 1);
      pg.fillStyle(p.cell.podColor || 0xdcb4c8, p.alpha);
      pg.fillCircle(p.x + dx * r * pulse, p.y + dy * r * pulse, r * 0.55);
      pg.fillStyle(0x1a0710, 0.5 * p.alpha);
      pg.fillCircle(p.x - dx * r * 0.9, p.y - dy * r * 0.9 + 1, 1.5);
    }
    for (const e of this.enemies.getChildren()) {
      if (!e.active || e.alpha < 0.5) continue;
      const w = Math.max(6, e.radius * 2.2);
      g.fillEllipse(e.x, e.y + e.radius + 1, w, Math.max(3, w * 0.3));
    }
    for (const c of this.allies) if (c.active) g.fillEllipse(c.x, c.y + 6, 10, 3);
  }

  burstFx(x, y, color, count = 10) {
    // anillo de lisis (la membrana se rompe)
    const ring = this.add.circle(x, y, 3).setStrokeStyle(1, color, 0.9).setDepth(12);
    this.tweens.add({ targets: ring, radius: 8 + count * 0.4, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
    const em = this.add.particles(x, y, 'pixel', {
      speed: { min: 30, max: 110 },
      lifespan: { min: 250, max: 550 },
      scale: { start: 1, end: 0 },
      tint: color,
      emitting: false,
    });
    em.setDepth(12);
    em.explode(count);
    this.time.delayedCall(700, () => em.destroy());
  }

  puff(x, y, color) {
    const em = this.add.particles(x, y, 'pixel', {
      speed: { min: 10, max: 40 },
      lifespan: 180,
      scale: { start: 0.8, end: 0 },
      tint: color,
      emitting: false,
    });
    em.setDepth(12);
    em.explode(3);
    this.time.delayedCall(250, () => em.destroy());
  }

  showDamage(x, y, dmg) {
    const v = Math.round(dmg * 10) / 10;
    const txt = this.add
      .text(x + Phaser.Math.Between(-3, 3), y, `${v % 1 ? v.toFixed(1) : v}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffffff',
        stroke: '#1a0710',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setResolution(2);
    this.tweens.add({ targets: txt, y: y - 12, alpha: 0, duration: 450, onComplete: () => txt.destroy() });
  }

  floatText(x, y, text, color = '#ffffff', duration = 900) {
    const txt = this.add
      .text(x, y, text, {
        fontFamily: '"VT323", monospace',
        fontSize: '12px',
        color,
        stroke: '#1a0710',
        strokeThickness: 3,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(31)
      .setResolution(3);
    this.tweens.add({ targets: txt, y: y - 14, alpha: { from: 1, to: 0 }, ease: 'Quad.easeIn', duration, onComplete: () => txt.destroy() });
  }
}
