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

// Tamaño del juego elegido para que cada píxel del juego ocupe un número ENTERO
// de píxeles físicos de la pantalla (k). Si el navegador estira el lienzo en
// proporciones no enteras, el escenario "tiembla" al moverse la cámara.
// La altura queda cerca de 540 píxeles de juego en cualquier pantalla.
function pixelPerfectSize() {
  const el = document.getElementById('game');
  const dpr = window.devicePixelRatio || 1;
  const w = el.clientWidth || window.innerWidth;
  const h = el.clientHeight || window.innerHeight;
  const k = Math.max(1, Math.round((h * dpr) / 540));
  return { width: Math.round((w * dpr) / k), height: Math.round((h * dpr) / k) };
}

function startGame() {
  const size = pixelPerfectSize();
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
      width: size.width,
      height: size.height,
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
  // al girar, entrar en pantalla completa o cambiar la ventana, recalcula el tamaño
  let refitTimer = null;
  const refit = () => {
    clearTimeout(refitTimer);
    refitTimer = setTimeout(() => {
      const s = pixelPerfectSize();
      if (s.width !== game.scale.width || s.height !== game.scale.height) game.scale.setGameSize(s.width, s.height);
      else game.scale.refresh();
    }, 200);
  };
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  window.visualViewport?.addEventListener('resize', refit);

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
