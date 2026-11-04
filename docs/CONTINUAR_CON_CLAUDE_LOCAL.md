# Cómo seguir el proyecto en tu PC con Claude

Si se acaban los créditos en la nube, todo el trabajo ya está guardado en GitHub. Esta guía explica cómo descargarlo y seguir trabajando con Claude en una carpeta de tu computadora.

## Paso 1. Descargar el proyecto

### Opción A: con Git (recomendada, permite traer cambios después)

En PowerShell:

```powershell
cd C:\Users\mizra\Documents
git clone https://github.com/El-Mizra/Inmune-roguelike.git
cd Inmune-roguelike
git checkout claude/immune-system-roguelike-game-hc1g1y
```

Si ya lo tienes clonado en `Downloads`, basta con:

```powershell
cd C:\Users\mizra\Downloads\Inmune-roguelike
git pull
```

### Opción B: sin Git (descarga directa en ZIP)

Abre este enlace en el navegador: descarga la rama donde está todo el trabajo.

https://github.com/El-Mizra/Inmune-roguelike/archive/refs/heads/claude/immune-system-roguelike-game-hc1g1y.zip

Descomprímelo en una carpeta, por ejemplo `C:\Users\mizra\Documents\Inmune-roguelike`.

> Ojo: el botón **Download ZIP** de la página principal descarga la rama `main`, que solo tiene el commit inicial. Usa el enlace de arriba o cambia antes a la rama `claude/immune-system-roguelike-game-hc1g1y`.

## Paso 2. Instalar y probar

```powershell
cd C:\Users\mizra\Documents\Inmune-roguelike
npm install
npm run dev
```

Abre http://localhost:5173. Si PowerShell bloquea `npm`, ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Paso 3. Conectar la carpeta con Claude

### Opción A: app de escritorio de Claude (la más sencilla)

1. Instala la app de escritorio de Claude desde https://claude.ai/download.
2. Abre la sección **Claude Code** dentro de la app.
3. Elige la carpeta del proyecto, por ejemplo `C:\Users\mizra\Documents\Inmune-roguelike`.
4. Claude leerá el archivo `CLAUDE.md` y conocerá el proyecto: estructura, convenciones, estado y próximos pasos.

### Opción B: Claude Code en la terminal

```powershell
npm install -g @anthropic-ai/claude-code
cd C:\Users\mizra\Documents\Inmune-roguelike
claude
```

### Opción C: proyecto en claude.ai (solo para conversar o diseñar)

En claude.ai crea un **Proyecto** y sube como conocimiento `CLAUDE.md` y `docs/GDD.md`. Sirve para planear y discutir diseño, pero no edita archivos. Para programar, usa la opción A o B.

## Paso 4. Primer mensaje sugerido para Claude

> "Lee CLAUDE.md y docs/GDD.md. Quiero continuar con el siguiente paso de la lista de próximos pasos. Antes de cambiar nada, dime el plan."

## Paso 5. Guardar tu avance

```powershell
git add -A
git commit -m "Describe tu cambio"
git push
```

También puedes pedirle a Claude que lo haga por ti.

## Si algo falla

| Problema | Solución |
|---|---|
| `git` no se reconoce | Instala Git y reabre PowerShell |
| `npm` bloqueado | Ejecuta `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| El celular no abre el juego | Permite Node.js en el firewall (redes privadas) y usa la IP `192.168.x.x` |
| Error al instalar dependencias | Borra la carpeta `node_modules` y repite `npm install` |
