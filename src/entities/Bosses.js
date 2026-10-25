import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { Sfx } from '../systems/sfx.js';
import { t } from '../systems/i18n.js';

// ---------- MRSA: biopelícula, toxinas y leucocidina ----------
export class MRSABoss extends Enemy {
  constructor(scene, x, y, room) {
    super(scene, x, y, 'mrsa', room);
    this.body.setImmovable(true);
    this.shards = [];
    this.orbit = 0;
    this.nextAttack = this.gt + 1800;
    this.pattern = 0;
    this.nextShard = 0;
    this.pvl = null;
    for (let i = 0; i < 6; i++) this.addShard();
  }

  get enraged() {
    return this.hp < this.maxHp * 0.5;
  }

  addShard() {
    const s = new Enemy(this.scene, this.x, this.y, 'biofilm', this.room, { countsForClear: false, noReward: true });
    s.body.setImmovable(true);
    s.slot = Math.random() * Math.PI * 2;
    this.shards.push(s);
  }

  ai_mrsa(dt) {
    const p = this.scene.player;
    this.shards = this.shards.filter((s) => s.active);
    // mientras haya biopelícula, el daño recibido se reduce
    this.dmgTakenMult = this.shards.length ? 0.5 : 1;
    if (this.shards.length) this.setTint(0xb8d070);
    else this.clearTint();

    // órbita de la biopelícula
    this.orbit += (dt / 1000) * (this.enraged ? 1.6 : 1);
    this.shards.forEach((s, i) => {
      const a = this.orbit + (i / Math.max(1, this.shards.length)) * Math.PI * 2;
      s.body.reset(this.x + Math.cos(a) * 32, this.y + Math.sin(a) * 30);
    });
    if (this.shards.length < 6 && this.gt >= this.nextShard) {
      this.nextShard = this.gt + (this.enraged ? 4500 : 6000);
      if (this.shards.length > 0 || this.gt - (this.shieldBrokenAt || 0) > 9000) this.addShard();
    }
    if (!this.shards.length && !this.shieldBrokenAt) this.shieldBrokenAt = this.gt;
    if (this.shards.length) this.shieldBrokenAt = 0;

    // avance lento
    this.moveToward(p.x, p.y, this.speedNow());

    // leucocidina PVL: círculo de aviso y luego daño
    if (this.pvl) {
      this.pvl.g.clear();
      const k = (this.gt - this.pvl.start) / 1000;
      this.pvl.g.lineStyle(2, 0xff3b3b, 0.8);
      this.pvl.g.strokeCircle(this.x, this.y, 60);
      this.pvl.g.fillStyle(0xff3b3b, 0.12 + k * 0.18);
      this.pvl.g.fillCircle(this.x, this.y, 60 * Math.min(1, k));
      if (k >= 1) {
        if (Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) < 60) p.hurt(this.gt, 1);
        this.scene.cameras.main.shake(100, 0.004);
        this.pvl.g.destroy();
        this.pvl = null;
      }
    }

    if (this.gt >= this.nextAttack) {
      const kind = ['burst', 'summon', 'burst', 'pvl'][this.pattern++ % 4];
      this.nextAttack = this.gt + (this.enraged ? 1700 : 2400);
      if (kind === 'burst') {
        const n = this.enraged ? 16 : 12;
        const off = Math.random();
        for (let i = 0; i < n; i++) this.shoot(off + (i / n) * Math.PI * 2, 'toxin', 70);
        if (this.enraged) {
          this.scene.time.delayedCall(320, () => {
            if (!this.active) return;
            for (let i = 0; i < n; i++) this.shoot(off + ((i + 0.5) / n) * Math.PI * 2, 'toxin', 70);
          });
        }
        Sfx.enemyShot();
      } else if (kind === 'summon') {
        for (let i = 0; i < 2; i++) {
          if (this.scene.roomEnemyCount(this.room) < 12) {
            const a = Math.random() * Math.PI * 2;
            this.scene.spawnEnemy('saureus', this.x + Math.cos(a) * 26, this.y + Math.sin(a) * 26, this.room, { gen: 1 });
          }
        }
        Sfx.split();
      } else if (!this.pvl) {
        this.pvl = { start: this.gt, g: this.scene.add.graphics().setDepth(5) };
        this.scene.floatText(this.x, this.y - 32, this.scene.lang === 'es' ? 'Leucocidina PVL' : 'PVL leukocidin', '#ff6b6b');
      }
    }
  }

  restoreTint() {
    if (this.shards.length) this.setTint(0xb8d070);
    else this.clearTint();
  }

  onDeath() {
    for (const s of this.shards) if (s.active) s.die(true);
    if (this.pvl) this.pvl.g.destroy();
  }
}

// ---------- Melanoma: evasión (MHC-I), metástasis y angiogénesis ----------
export class MelanomaBoss extends Enemy {
  constructor(scene, x, y, room) {
    super(scene, x, y, 'melanoma', room);
    this.body.setImmovable(true);
    this.nodes = [];
    this.nextAttack = this.gt + 1600;
    this.pattern = 0;
    this.spiral = null;
    this.nextStealth = this.gt + 9000;
    this.stealthUntil = 0;
    this.vessels = scene.add.graphics().setDepth(4);
    this.pickWaypoint();
  }

  get enraged() {
    return this.hp < this.maxHp * 0.5;
  }

  pickWaypoint() {
    const r = this.room;
    const T = 16;
    this.waypoint = new Phaser.Math.Vector2(
      (r.x + 4 + Math.random() * (r.w - 8)) * T,
      (r.y + 4 + Math.random() * (r.h - 8)) * T,
    );
  }

  ai_melanoma(dt) {
    this.nodes = this.nodes.filter((n) => n.active);
    // movimiento entre puntos
    if (Phaser.Math.Distance.Between(this.x, this.y, this.waypoint.x, this.waypoint.y) < 8) this.pickWaypoint();
    this.moveToward(this.waypoint.x, this.waypoint.y, this.speedNow());

    // angiogénesis: los nódulos alimentan al tumor
    this.vessels.clear();
    for (const n of this.nodes) {
      this.vessels.lineStyle(2, 0x8a1a2a, 0.9);
      this.vessels.lineBetween(n.x, n.y, this.x, this.y);
      this.vessels.lineStyle(1, 0xd04050, 0.9);
      this.vessels.lineBetween(n.x, n.y, this.x, this.y);
    }
    if (this.nodes.length) this.hp = Math.min(this.maxHp, this.hp + (this.nodes.length * 2 * dt) / 1000);

    // evasión inmune: baja MHC-I → difícil de detectar
    if (this.gt >= this.nextStealth && !this.stealth) {
      this.stealth = true;
      this.stealthUntil = this.gt + 4000;
      this.dmgTakenMult = 0.5;
      this.setAlpha(0.35);
      this.scene.floatText(this.x, this.y - 34, t('camouflage'), '#c9a0ff');
    }
    if (this.stealth && this.gt >= this.stealthUntil) {
      this.stealth = false;
      this.dmgTakenMult = 1;
      this.setAlpha(1);
      this.nextStealth = this.gt + (this.enraged ? 8000 : 11000);
    }

    // espiral de disparos
    if (this.spiral) {
      if (this.gt >= this.spiral.next) {
        const arms = this.enraged ? 3 : 2;
        for (let i = 0; i < arms; i++) this.shoot(this.spiral.a + (i / arms) * Math.PI * 2, 'darkshot', 62);
        this.spiral.a += 0.32;
        this.spiral.next = this.gt + 120;
      }
      if (this.gt >= this.spiral.until) this.spiral = null;
    }

    if (this.gt >= this.nextAttack) {
      const kind = ['spiral', 'metastasis', 'aimed', 'spiral'][this.pattern++ % 4];
      this.nextAttack = this.gt + (this.enraged ? 2200 : 2900);
      if (kind === 'spiral') {
        this.spiral = { a: Math.random() * 6, next: this.gt, until: this.gt + 2000 };
      } else if (kind === 'aimed') {
        const a = this.angleToPlayer();
        for (const off of [-0.4, -0.2, 0, 0.2, 0.4]) this.shoot(a + off, 'darkshot', 95);
        Sfx.enemyShot();
      } else {
        this.metastasize(this.enraged ? 2 : 1);
      }
    }
  }

  metastasize(n) {
    for (let i = 0; i < n; i++) {
      if (this.nodes.length + i >= 3) break;
      const r = this.room;
      const T = 16;
      const tx = (r.x + 3 + Math.random() * (r.w - 6)) * T;
      const ty = (r.y + 3 + Math.random() * (r.h - 6)) * T;
      const seed = this.scene.add.image(this.x, this.y, 'seed').setDepth(9);
      this.scene.tweens.add({
        targets: seed,
        x: tx,
        y: ty,
        duration: 900,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => seed.setScale(1 + Math.sin(tw.progress * Math.PI) * 0.8),
        onComplete: () => {
          seed.destroy();
          if (!this.active) return;
          const node = this.scene.spawnEnemy('tumornode', tx, ty, this.room, { noReward: true });
          node.body.setImmovable(true);
          this.nodes.push(node);
        },
      });
    }
    this.scene.floatText(this.x, this.y - 34, this.scene.lang === 'es' ? 'Metástasis' : 'Metastasis', '#d08060');
  }

  onDeath() {
    for (const n of this.nodes) if (n.active) n.die(true);
    this.vessels.destroy();
  }
}
