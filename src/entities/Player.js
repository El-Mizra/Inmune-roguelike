import Phaser from 'phaser';
import { CELLS } from '../data/cells.js';
import { UPGRADES } from '../data/upgrades.js';
import { memoryBonus } from '../systems/storage.js';
import { Sfx } from '../systems/sfx.js';

// Construye las estadísticas del jugador a partir de la célula base y las
// mejoras recogidas durante la partida.
export function buildStats(cellId, upgradeIds) {
  const cell = CELLS[cellId];
  const s = {
    ...cell.stats,
    pierce: 0,
    bonus: { bacteria: 0, gramPos: 0, gramNeg: 0, fungus: 0, virus: 0, biofilm: 0, cancer: 0 },
    fissionMult: 1,
    enemySlow: 1,
    cellShield: 0,
    atpRegen: 3,
    skillCost: cell.skill.cost,
    skillCooldown: cell.skill.cooldown,
    skillRadius: cell.skill.radius,
    skillDuration: cell.skill.duration,
  };
  for (const id of upgradeIds) UPGRADES[id].apply(s, null);
  return s;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, run) {
    super(scene, x, y, CELLS[run.cellId].texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.run = run;
    this.cell = CELLS[run.cellId];
    this.stats = buildStats(run.cellId, run.upgrades);
    this.hp = Math.min(run.hp ?? this.stats.maxHp, this.stats.maxHp);
    this.armor = this.stats.maxArmor;
    this.atp = run.atp ?? this.stats.maxAtp;
    this.body.setCircle(5, 3, 4);
    this.setDepth(10);
    this.play('neutrophil_idle');
    this.nextFire = 0;
    this.skillReadyAt = 0;
    this.invulnUntil = 0;
    this.lastHurt = -99999;
    this.nextArmorTick = 0;
    this.aim = new Phaser.Math.Vector2(1, 0);
    this.dead = false;
  }

  addUpgrade(id) {
    this.run.upgrades.push(id);
    const prevMax = this.stats.maxHp;
    this.stats = buildStats(this.run.cellId, this.run.upgrades);
    if (this.stats.maxHp > prevMax) this.heal(this.stats.maxHp - prevMax);
  }

  heal(n) {
    this.hp = Math.min(this.stats.maxHp, this.hp + n);
  }

  addAtp(n) {
    this.atp = Math.min(this.stats.maxAtp, this.atp + n);
  }

  // Multiplicador de daño contra una especie concreta.
  damageMultiplier(def, speciesId) {
    let m = 1;
    for (const tag of def.tags) if (this.stats.bonus[tag]) m += this.stats.bonus[tag];
    m += memoryBonus(speciesId);
    return m;
  }

  tick(gt, dt) {
    if (this.dead) return;
    // regeneración de membrana (como el escudo de Soul Knight)
    if (this.armor < this.stats.maxArmor && gt - this.lastHurt > 3500 && gt >= this.nextArmorTick) {
      this.armor += 1;
      this.nextArmorTick = gt + 1100;
    }
    this.addAtp((this.stats.atpRegen * dt) / 1000);
    this.setAlpha(gt < this.invulnUntil ? (Math.floor(gt / 80) % 2 ? 0.4 : 1) : 1);
  }

  canFire(gt) {
    return gt >= this.nextFire;
  }

  fire(gt, dirX, dirY) {
    this.nextFire = gt + 1000 / this.stats.fireRate;
    const scene = this.scene;
    const base = Math.atan2(dirY, dirX);
    const ang = base + Phaser.Math.FloatBetween(-this.stats.spread, this.stats.spread);
    const ox = Math.cos(base) * 7;
    const oy = Math.sin(base) * 7;
    scene.firePlayerBullet(this.x + ox, this.y + oy, ang, {
      speed: this.stats.bulletSpeed,
      damage: this.stats.damage,
      pierce: this.stats.pierce,
      life: (this.stats.range / this.stats.bulletSpeed) * 1000,
    });
    Sfx.shoot();
  }

  skillReady(gt) {
    return gt >= this.skillReadyAt && this.atp >= this.stats.skillCost;
  }

  useSkill(gt) {
    if (!this.skillReady(gt)) return false;
    this.atp -= this.stats.skillCost;
    this.skillReadyAt = gt + this.stats.skillCooldown;
    this.scene.castNet(this.x, this.y, this.stats.skillRadius, this.stats.skillDuration);
    Sfx.skill();
    return true;
  }

  hurt(gt, amount) {
    if (this.dead || gt < this.invulnUntil) return false;
    this.lastHurt = gt;
    this.invulnUntil = gt + 900;
    let left = amount;
    if (this.armor > 0) {
      const a = Math.min(this.armor, left);
      this.armor -= a;
      left -= a;
    }
    this.hp -= left;
    Sfx.hurt();
    this.scene.cameras.main.shake(120, 0.006);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.active && this.clearTint());
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      this.setVelocity(0, 0);
      this.scene.onPlayerDeath();
    }
    return true;
  }
}
