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
import { DebugScene } from './scenes/DebugScene.js';
import { StickPlaceScene } from './scenes/StickPlaceScene.js';
import { Save } from './systems/storage.js';

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
      // tamaño entero del lienzo: evita costuras entre baldosas al escalar
      autoRound: true,
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
    scene: [BootScene, MenuScene, CellSelectScene, ResultScene, GameScene, UIScene, PauseScene, SettingsScene, CodexScene, ChoiceScene, DebugScene, StickPlaceScene],
  });
  window.__game = game;

  // En celular, el navegador sale de pantalla completa al cambiar de app.
  // Cualquier toque al volver la reactiva (tiene que ser dentro de un gesto del usuario).
  // iPhone/iPad: tras girar la pantalla o abrir desde el ícono, recalcula el tamaño
  const refreshSize = () => setTimeout(() => game.scale.refresh(), 300);
  window.addEventListener('orientationchange', refreshSize);
  window.visualViewport?.addEventListener('resize', refreshSize);

  let fullscreenBlockedUntil = 0;
  game.scale.on('fullscreenfailed', () => {
    fullscreenBlockedUntil = performance.now() + 15000;
  });
  document.addEventListener(
    'pointerup',
    () => {
      if (!Save.isTouch || game.scale.isFullscreen || !game.scale.fullscreen.available) return;
      if (performance.now() < fullscreenBlockedUntil) return;
      try {
        game.scale.startFullscreen();
        screen.orientation?.lock?.('landscape')?.catch?.(() => {});
      } catch {
        /* el navegador no lo permite (p. ej. dentro de un iframe) */
      }
    },
    { passive: true },
  );
}

// Espera a que las fuentes pixeladas estén listas para que los textos no
// se rendericen con la fuente de reserva.
const fonts = [document.fonts.load('16px "Press Start 2P"'), document.fonts.load('22px "VT323"')];
Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 2500))])
  .catch(() => {})
  .then(startGame);
