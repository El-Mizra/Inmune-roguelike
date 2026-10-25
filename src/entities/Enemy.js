import Phaser from 'phaser';
import { ENEMIES } from '../data/enemies.js';
import { Sfx } from '../systems/sfx.js';

const ANIMS = {
  saureus: 'saureus_idle',
  paeruginosa: 'paeruginosa_swim',
  calbicans: 'calbicans_idle',
  hsv1: 'hsv1_idle',
  infected: 'kera_infected_idle',
  biofilm: 'biofilm_idle',
  tumornode: 'tumornode_idle',
  mrsa: 'mrsa_idle',
  melanoma: 'melanoma_idle',
};

// Enemigo genérico. El comportamiento específico de cada especie está en
// los métodos `ai_<id>`; los jefes heredan de esta clase (ver Bosses.js).
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id, room, opts = {}) {
    const def = ENEMIES[id];
    super(scene, x, y, def.texture, 0);
    this.id = id;
    this.def = def;
    this.room = room;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this);
    const hpMult = def.boss ? 1 : scene.hpMult;
    this.maxHp = Math.round(def.hp * hpMult * (opts.hpMult || 1));
    this.hp = this.maxHp;
    this.tags = def.tags;
    this.radius = def.radius;
    const w = this.width;
    const h = this.height;
    this.body.setCircle(def.radius, w / 2 - def.radius, h / 2 - def.radius);
    this.setDepth(8);
    if (ANIMS[id]) this.play(ANIMS[id]);
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.phase = Math.random() * 1000;
    this.stealth = false;
    this.dmgTakenMult = 1;
    this.countsForClear = opts.countsForClear ?? true;
    this.noReward = !!opts.noReward;
    this.leader = opts.leader || null;
    const initFn = this[`init_${id}`];
    if (initFn) initFn.call(this, opts);
  }

  get gt() {
    return this.scene.gt;
  }

  speedNow() {
    const slow = this.gt < this.slowUntil ? this.slowFactor : 1;
    return this.def.speed * slow * this.scene.player.stats.enemySlow;
  }

  moveToward(tx, ty, speed) {
    const a = Math.atan2(ty - this.y, tx - this.x);
    this.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    return a;
  }

  distTo(o) {
    return Phaser.Math.Distance.Between(this.x, this.y, o.x, o.y);
  }

  angleToPlayer() {
    const p = this.scene.player;
    return Math.atan2(p.y - this.y, p.x - this.x);
  }

  shoot(angle, texture, speed, damage = 1) {
    this.scene.fireEnemyBullet(this.x, this.y, angle, texture, speed, damage);
  }

  tick(dt) {
    const fn = this[`ai_${this.id}`];
    if (fn) fn.call(this, dt);
    // red de seguridad: si acaba dentro de un muro, sácalo al suelo más cercano
    if (this.active && this.gt >= (this.nextStuckCheck || 0)) {
      this.nextStuckCheck = this.gt + 400;
      this.scene.unstick(this);
    }
  }

  takeDamage(amount, source = 'shot') {
    if (!this.active || this.dying) return;
    let dmg = amount * this.dmgTakenMult;
    if (this.isHypha) dmg *= source === 'net' ? 3 : 0.5;
    this.hp -= dmg;
    this.scene.showDamage(this.x, this.y - this.height / 2, dmg);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.restoreTint();
    });
    Sfx.hit();
    if (this.hp <= 0) this.die();
  }

  restoreTint() {
    this.clearTint();
  }

  die(silent = false) {
    if (this.dying) return;
    this.dying = true;
    this.onDeath?.();
    this.scene.onEnemyKilled(this, silent);
    this.destroy();
  }

  // ---------- Staphylococcus aureus: fisión binaria ----------
  init_saureus(opts) {
    // generación: cada fisión produce dos hijas de la generación siguiente.
    // Se limita para que la población no crezca sin fin dentro de una sala.
    this.gen = opts.gen || 0;
    this.scheduleFission();
  }
  scheduleFission() {
    const f = this.def.fission;
    this.nextFission = this.gt + (f.every + Math.random() * f.jitter) * this.scene.player.stats.fissionMult;
  }
  ai_saureus() {
    const p = this.scene.player;
    const a = this.angleToPlayer() + Math.sin(this.gt * 0.002 + this.phase) * 0.8;
    const s = this.speedNow();
    this.setVelocity(Math.cos(a) * s, Math.sin(a) * s);
    if (this.gen < this.def.fission.maxGen && this.gt >= this.nextFission) {
      this.scheduleFission();
      if (this.scene.roomEnemyCount(this.room) < 14 && this.distTo(p) > 20) {
        this.gen += 1;
        const ang = Math.random() * Math.PI * 2;
        const child = this.scene.spawnEnemy('saureus', this.x + Math.cos(ang) * 6, this.y + Math.sin(ang) * 6, this.room, { gen: this.gen });
        child.setScale(0.4);
        this.scene.tweens.add({ targets: child, scale: 1, duration: 300 });
        Sfx.split();
      }
    }
  }

  // ---------- Streptococcus pyogenes: cadenas ----------
  ai_spyogenes() {
    if (this.leader && !this.leader.active) this.leader = null;
    if (this.leader) {
      const d = this.distTo(this.leader);
      if (d > 7) this.moveToward(this.leader.x, this.leader.y, Math.min(this.def.speed * 1.8, d * 9));
      else this.setVelocity(0, 0);
      return;
    }
    const a = this.angleToPlayer() + Math.sin(this.gt * 0.004 + this.phase) * 0.9;
    const s = this.speedNow();
    this.setVelocity(Math.cos(a) * s, Math.sin(a) * s);
  }

  // ---------- Pseudomonas aeruginosa: tirones + piocianina ----------
  init_paeruginosa() {
    this.state = 'idle';
    this.stateUntil = this.gt + 600 + Math.random() * 600;
    this.shotDone = false;
  }
  ai_paeruginosa() {
    const p = this.scene.player;
    if (this.state === 'idle') {
      this.setVelocity(this.body.velocity.x * 0.85, this.body.velocity.y * 0.85);
      this.rotation = this.angleToPlayer();
      if (!this.shotDone && this.stateUntil - this.gt < 450) {
        this.shotDone = true;
        const sh = this.def.shoot;
        this.shoot(this.angleToPlayer(), 'pyocyanin', sh.speed, sh.damage);
        if (this.scene.floorIndex > 0) {
          this.shoot(this.angleToPlayer() + 0.25, 'pyocyanin', sh.speed, sh.damage);
          this.shoot(this.angleToPlayer() - 0.25, 'pyocyanin', sh.speed, sh.damage);
        }
        Sfx.enemyShot();
      }
      if (this.gt >= this.stateUntil) {
        // elige un punto a media distancia del jugador
        const ang = Math.random() * Math.PI * 2;
        const dist = 70 + Math.random() * 60;
        this.target = this.scene.clampToRoom(this.room, p.x + Math.cos(ang) * dist, p.y + Math.sin(ang) * dist);
        this.state = 'dash';
        this.stateUntil = this.gt + 650;
      }
    } else {
      const a = this.moveToward(this.target.x, this.target.y, this.speedNow());
      this.rotation = a;
      if (this.gt >= this.stateUntil || Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y) < 6) {
        this.state = 'idle';
        this.stateUntil = this.gt + this.def.shoot.every * (0.7 + Math.random() * 0.5);
        this.shotDone = false;
      }
    }
  }

  // ---------- Candida albicans: levadura → hifa ----------
  init_calbicans() {
    const h = this.def.hypha;
    this.hyphaAt = this.gt + h.after + Math.random() * h.jitter;
    this.isHypha = false;
  }
  ai_calbicans() {
    const h = this.def.hypha;
    if (!this.isHypha) {
      const a = this.angleToPlayer() + Math.sin(this.gt * 0.0015 + this.phase) * 1.2;
      const s = this.speedNow();
      this.setVelocity(Math.cos(a) * s, Math.sin(a) * s);
      if (this.gt >= this.hyphaAt) this.becomeHypha();
      return;
    }
    this.setVelocity(0, 0);
    if (this.gt >= this.nextSpore) {
      this.nextSpore = this.gt + h.shootEvery;
      const a = this.angleToPlayer();
      for (const off of [-0.3, 0, 0.3]) this.shoot(a + off, 'spore', 60, h.damage);
      Sfx.enemyShot();
    }
  }
  becomeHypha() {
    const h = this.def.hypha;
    this.isHypha = true;
    this.setTexture('hypha', 0);
    this.play('hypha_idle');
    this.body.setCircle(9, this.width / 2 - 9, this.height / 2 - 9);
    this.body.setImmovable(true);
    this.maxHp = Math.round(h.hp * this.scene.hpMult);
    this.hp = this.maxHp;
    this.nextSpore = this.gt + 1200;
    this.scene.floatText(this.x, this.y - 16, this.scene.lang === 'es' ? '¡Hifas!' : 'Hyphae!', '#ecdcb6');
  }

  // ---------- HSV-1: infecta células sanas ----------
  ai_hsv1() {
    if (!this.hostTarget || !this.hostTarget.active || this.hostTarget.infected) {
      this.hostTarget = this.scene.nearestHostCell(this);
    }
    const s = this.speedNow();
    if (this.hostTarget) {
      this.moveToward(this.hostTarget.x, this.hostTarget.y, s);
      if (this.distTo(this.hostTarget) < 7) this.scene.infectHostCell(this.hostTarget, this);
    } else {
      const a = this.angleToPlayer() + Math.sin(this.gt * 0.006 + this.phase) * 0.6;
      this.setVelocity(Math.cos(a) * s, Math.sin(a) * s);
    }
  }

  // ---------- Queratinocito infectado: estalla liberando viriones ----------
  init_infected() {
    this.burstAt = this.gt + ENEMIES.hsv1.infect.burstAfter;
    this.body.setImmovable(true);
  }
  ai_infected() {
    this.setVelocity(0, 0);
    const left = this.burstAt - this.gt;
    if (left < 1200) this.setScale(1 + Math.sin(this.gt * 0.03) * 0.08);
    if (left <= 0) {
      const n = ENEMIES.hsv1.infect.virions;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.scene.spawnEnemy('hsv1', this.x + Math.cos(a) * 8, this.y + Math.sin(a) * 8, this.room);
      }
      this.scene.burstFx(this.x, this.y, 0xc56b9c);
      this.die(true);
    }
  }

  // ---------- Partes de jefes (sin IA propia) ----------
  ai_biofilm() {}
  ai_tumornode() {
    this.setVelocity(0, 0);
  }
}
