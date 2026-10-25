import Phaser from 'phaser';
import { generateFloor, TILE, SOLID } from '../systems/dungeon.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MRSABoss, MelanomaBoss } from '../entities/Bosses.js';
import { ENEMIES, FLOOR_POOLS, FLOOR_BOSSES, CODEX_PATHOGENS } from '../data/enemies.js';
import { UPGRADE_IDS } from '../data/upgrades.js';
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

    for (const e of this.enemies.getChildren().slice()) if (e.active) e.tick(dt);

    for (const b of this.playerBullets.getChildren()) if (b.active && this.gt >= b.dieAt) this.killBullet(b, false);
    for (const b of this.enemyBullets.getChildren()) if (b.active && this.gt >= b.dieAt) this.killBullet(b, false);

    this.updateNets();
    this.updatePickups(dt);
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
      target = this.nearestTarget(p.stats.range * 1.15);
      if (target) dir = new Phaser.Math.Vector2(target.x - p.x, target.y - p.y);
      else if (!dir) dir = this.lastMove.clone();
    } else if (mode === 'assist') {
      target = this.targetInCone(dir, 0.32, p.stats.range * 1.15);
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
      if (!e.active || e.stealth || e.dying) return false;
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
  firePlayerBullet(x, y, ang, { speed, damage, pierce, life }) {
    const b = this.playerBullets.get(x, y, 'granule');
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setDepth(9);
    b.body.setCircle(2.5, 0.5, 0.5);
    b.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
    b.damage = damage;
    b.pierce = pierce;
    b.dieAt = this.gt + life;
    b.hits = new Set();
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
    const dmg = b.damage * this.player.damageMultiplier(e.def, e.id);
    e.takeDamage(dmg, 'shot');
    if (b.pierce > 0) b.pierce -= 1;
    else this.killBullet(b);
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
    let pool = UPGRADE_IDS.filter((id) => !taken.has(id));
    if (pool.length < 3) pool = UPGRADE_IDS.slice();
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
    const summary = Object.entries(this.run.kills).map(([id, n]) => {
      const before = memoryTier(id);
      return { id, n, before };
    });
    Save.addKills(this.run.kills);
    for (const s of summary) s.after = memoryTier(s.id);
    Save.endRun(won);
    const data = { won, time: this.run.elapsed, kills: summary, floor: this.run.floor, upgrades: this.run.upgrades.slice() };
    this.cameras.main.fadeOut(500, 18, 6, 12);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UI');
      this.scene.start('Result', data);
    });
  }

  // ------------------------------------------------------------------
  // Efectos
  burstFx(x, y, color, count = 10) {
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
