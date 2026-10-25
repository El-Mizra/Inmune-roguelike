import Phaser from 'phaser';
import { generateTextures, createAnimations } from '../gfx/sprites.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    generateTextures(this);
    createAnimations(this);
    this.scene.start('Menu');
  }
}
