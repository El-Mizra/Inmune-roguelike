# Desarrollo local (offline) en Windows

Guía para continuar el proyecto en tu computadora, sin depender de la nube.

## 1. Requisitos (una sola vez)

- **Git:** https://git-scm.com/download/win
- **Node.js LTS:** https://nodejs.org
- **Editor:** se recomienda [Visual Studio Code](https://code.visualstudio.com).
- Si PowerShell bloquea `npm`, ejecuta una vez:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```

## 2. Obtener el proyecto

Si ya lo clonaste, salta al paso 3.

```powershell
cd C:\Users\mizra\Downloads
git clone https://github.com/El-Mizra/Inmune-roguelike.git
cd Inmune-roguelike
git checkout claude/immune-system-roguelike-game-hc1g1y
npm install
```

## 3. Traer los últimos cambios de GitHub

Cada vez que se haya trabajado en la nube:

```powershell
cd C:\Users\mizra\Downloads\Inmune-roguelike
git pull
npm install
```

## 4. Jugar y desarrollar

```powershell
npm run dev
```

- **PC:** abre http://localhost:5173.
- **Celular** (en la misma Wi-Fi): usa la dirección `Network: http://192.168.x.x:5173` que muestra la terminal.
- Al guardar un archivo, el juego se recarga solo.

Para la versión final, ejecuta `npm run build`. Se genera la carpeta `dist/`, que se puede subir a itch.io o a GitHub Pages.

## 5. Guardar tu propio trabajo en GitHub

```powershell
git add -A
git commit -m "Describe aquí tu cambio"
git push
```

## 6. Qué archivo tocar para cada cosa

| Quiero cambiar... | Archivo |
|---|---|
| Vida, daño o velocidad de una célula | `src/data/cells.js` |
| Estadísticas de un patógeno o jefe | `src/data/enemies.js` |
| Mejoras (moléculas) | `src/data/upgrades.js` |
| Textos de la interfaz (ES/EN) | `src/systems/i18n.js` |
| Comportamiento de un enemigo | `src/entities/Enemy.js` y `src/entities/Bosses.js` |
| Cómo funciona un personaje | `src/entities/Player.js` |
| Dibujos (pixel art) | `src/gfx/sprites.js` |
| Salas, oleadas y reglas de la partida | `src/scenes/GameScene.js` |
| Generación de mapas | `src/systems/dungeon.js` |

El diseño completo del juego está en [`GDD.md`](GDD.md).

## 7. Si quieres usar Claude en local

Claude Code también funciona en tu PC:

```powershell
npm install -g @anthropic-ai/claude-code
claude
```

Se ejecuta dentro de la carpeta del proyecto.
