# CLAUDE.md: contexto del proyecto para Claude Code

**Inmune** es un roguelike pixel-art del sistema inmune, inspirado en *Soul Knight*. Controlas células inmunes reales contra patógenos y cáncer, con mecánicas basadas en biología real. Corre en navegador (PC y móvil) y está pensado para empaquetarse como app más adelante (Capacitor).

El autor habla español: responde en español. El diseño completo está en `docs/GDD.md`.

## Comandos

```bash
npm install       # dependencias
npm run dev       # servidor de desarrollo con recarga (también accesible desde el móvil en la misma red)
npm run build     # build de producción en dist/ (úsalo para comprobar que todo compila)
npm run preview   # sirve dist/
```

No hay tests automáticos. Para validar cambios, ejecuta `npm run build` y prueba en el navegador. Con Playwright se puede controlar el juego desde `window.__game`; por ejemplo, `window.__game.scene.getScene('Game')` da acceso al jugador, los enemigos y el mapa.

## Arquitectura (Phaser 3 + Vite, JavaScript con módulos ES)

- `src/main.js`: configuración de Phaser. Resolución base 960×540, escala `EXPAND`. El orden de las escenas define cuál se dibuja encima.
- `src/data/`: **contenido**, separado de la lógica. Los textos son objetos `{ es, en }`.
  - `cells.js`: células jugables (estadísticas, arma `projectile` o `melee`, habilidad, datos reales).
  - `enemies.js`: patógenos y jefes (estadísticas, etiquetas, fichas de la enciclopedia), `FLOOR_POOLS` y `FLOOR_BOSSES`.
  - `upgrades.js`: mejoras basadas en moléculas reales, con `apply(stats)`. `only` restringe una mejora por tipo de arma.
- `src/entities/`:
  - `Player.js`: `buildStats()`, disparo y zarpazo, habilidades, daño y membrana.
  - `Enemy.js`: IA por especie en métodos `ai_<id>` e `init_<id>`.
  - `Bosses.js`: `MRSABoss` y `MelanomaBoss`.
- `src/scenes/`:
  - `GameScene.js`: salas, oleadas, proyectiles, NET, zarpazo, mejoras y portal.
  - `UIScene.js`: HUD, minimapa y controles táctiles.
  - Menús: `Menu`, `CellSelect`, `Settings`, `Codex`, `Pause`, `Choice` y `Result`.
- `src/systems/`:
  - `dungeon.js`: generación procedural del piso.
  - `i18n.js`: `t(clave)` para la interfaz y `L({es,en})` para el contenido.
  - `storage.js`: guardado en localStorage y memoria inmunológica.
  - `sfx.js`: sonido sintetizado con WebAudio.
  - `controls.js`: estado de los controles táctiles.
  - `ui.js`: botones, paneles y fuentes.
- `src/gfx/`: el pixel art **se genera por código**. `painter.js` es el pintor de píxeles y `sprites.js` contiene los sprites, paletas y animaciones. Para usar arte hecho a mano, carga imágenes con la misma clave de textura.

## Convenciones

- Comentarios y nombres de contenido en español; las claves internas (ids) en inglés corto (`saureus`, `hsv1`).
- Todo texto visible debe existir en español e inglés.
- Cada mecánica nueva debe basarse en biología real y llevar su dato educativo (ficha o carta).
- Para la lógica de juego usa el reloj propio `scene.gt` (que respeta la pausa), no `time.now`.
- Una especie nueva se añade en `enemies.js` y luego con `ai_<id>` en `Enemy.js`, su sprite en `sprites.js` y su entrada en `CODEX_PATHOGENS` y `FLOOR_POOLS`.
- Una célula nueva se añade en `cells.js` (`playable: true`), con su sprite y su animación `<texture>_idle`, y su lógica en `Player.fire` y `Player.useSkill`.

## Estado actual

- **Células jugables:** neutrófilo (proyectiles + NET), macrófago (cuerpo a cuerpo + activación M1), célula NK (perforina + sinapsis; detecta al melanoma camuflado) linfocito T CD8 (granzimas, aprende durante la partida y tiene expansión clonal con aliados) y linfocito B (anticuerpos que opsonizan (+30% de daño recibido) y neutralizan virus; ráfaga de célula plasmática).
- **Zona 1, la piel:** 2 pisos.
  - **Patógenos:** S. aureus, S. pyogenes, P. aeruginosa, Candida y HSV-1.
  - **Jefes:** MRSA y melanoma.
- **Sistemas:** 14 mejoras, enciclopedia y memoria inmunológica entre partidas.
- **Arte:** sombras, decoración de la dermis (`decor`), partículas ambientales, viñeta, anillo de lisis y pseudópodo al moverse.

## Próximos pasos sugeridos

1. Eosinófilo (para parásitos en la zona del intestino) y sistema de desbloqueo de células.
2. Más arte: sprites hechos a mano, música.
3. Zona 2, el pulmón: *S. pneumoniae*, influenza y *Aspergillus*; como jefes, tuberculosis (granuloma) y cáncer de pulmón.
4. Música, y empaquetado con Capacitor para Android.
