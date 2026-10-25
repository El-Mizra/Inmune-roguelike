# Inmune

Roguelike pixel-art del sistema inmune, inspirado en *Soul Knight*. Controlas células inmunes reales (por ahora, el **neutrófilo**) contra bacterias, hongos, virus y cáncer, con mecánicas basadas en biología real. Se juega en navegador, en PC y en móvil.

*Immune system pixel-art roguelike inspired by Soul Knight. Playable on desktop and mobile browsers, in Spanish and English.*

## Cómo jugarlo

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo (también accesible desde el celular en la misma red)
npm run build    # genera la versión final en dist/
npm run preview  # sirve la versión de dist/
```

Para probarlo en el celular: ejecuta `npm run dev`, abre en el móvil la dirección "Network" que muestra la terminal (por ejemplo `http://192.168.1.20:5173`) y pon el teléfono en horizontal.

## Controles

| | PC | Móvil |
|---|---|---|
| Moverse | WASD / flechas | Stick izquierdo (aparece donde tocas) |
| Disparar | Clic izquierdo (mantener) o J | Mantener pulsada la mitad derecha |
| Apuntar | Ratón | Automático, o arrastrar en la mitad derecha (modo manual/asistido) |
| Habilidad (NET) | Espacio / clic derecho / K | Botón azul |
| Pausa | Esc / P | Botón de pausa |

El modo de apuntado (manual, asistido o automático) se cambia en **Ajustes**.

## Contenido del prototipo (v0.1)

- **Zona 1, la piel:** dos pisos procedurales con salas de combate, una sala de mejora y un jefe por piso.
- **Patógenos:** *S. aureus* (se divide), *S. pyogenes* (cadenas), *P. aeruginosa* (dispara piocianina), *Candida albicans* (pasa de levadura a hifas), HSV-1 (infecta células sanas).
- **Jefes:** **MRSA**, con biopelícula y leucocidina, y **melanoma**, con evasión por MHC-I, metástasis y angiogénesis.
- **14 mejoras** basadas en moléculas reales: IL-8, TNF-α, lisozima, lactoferrina, interferón, etc.
- **Enciclopedia** que se desbloquea al jugar, con datos científicos.
- **Memoria inmunológica:** hace más daño a las especies que ya has vencido muchas veces.
- Interfaz y contenido en español e inglés.

El diseño completo y el plan de zonas futuras están en [`docs/GDD.md`](docs/GDD.md).
