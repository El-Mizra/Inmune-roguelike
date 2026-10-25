import Phaser from 'phaser';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/vt323/400.css';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CellSelectScene } from './scenes/CellSelectScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { CodexScene } from './scenes/CodexScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ChoiceScene } from './scenes/ChoiceScene.js';
import { ResultScene } from './scenes/ResultScene.js';

// Resolución base 960×540; el modo EXPAND amplía el lienzo para llenar
// pantallas más anchas (móviles 19.5:9) sin bandas negras.
function startGame() {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#12060c',
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960,
      height: 540,
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    input: { activePointers: 4 },
    // El orden define qué escena se dibuja encima: las capas (pausa, ajustes,
    // enciclopedia, elección) van después del juego y del HUD.
    scene: [BootScene, MenuScene, CellSelectScene, ResultScene, GameScene, UIScene, PauseScene, SettingsScene, CodexScene, ChoiceScene],
  });
  window.__game = game;
}

// Espera a que las fuentes pixeladas estén listas para que los textos no
// se rendericen con la fuente de reserva.
const fonts = [document.fonts.load('16px "Press Start 2P"'), document.fonts.load('22px "VT323"')];
Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 2500))])
  .catch(() => {})
  .then(startGame);
