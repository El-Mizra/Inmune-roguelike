# Hoja de ruta: Inmune en móvil y PC

Objetivo: un juego estilo *Soul Knight* que se juegue igual de bien en **celular (Android/iOS)** y en **PC**, con la misma base de código (Phaser + Vite).

## Fase 1. Jugable y publicable en web (corto plazo)
- [ ] Publicar la versión web gratis en **itch.io** o **GitHub Pages** (`npm run build` → subir `dist/`). Así cualquiera la prueba desde un enlace.
- [ ] Convertirla en **PWA instalable**: añadir íconos (192 y 512 px) y un *service worker* (`vite-plugin-pwa`) para que funcione sin conexión y se pueda "instalar" en el celular.
- [ ] Probar en celulares reales: rendimiento (60 fps), tamaño de los botones táctiles, vibración al recibir daño (`navigator.vibrate`) y que no se vean barras negras.
- [ ] Mando o gamepad en PC (la API Gamepad de Phaser).

## Fase 2. Contenido para runs de 15 a 20 minutos
- [ ] **Zona 2, el pulmón:** *S. pneumoniae*, influenza y *Aspergillus*; como jefes, tuberculosis (granuloma) y cáncer de pulmón. Mecánica de zona: el moco ralentiza.
- [ ] **Zona 3, el intestino:** *Salmonella*, *C. difficile* y helmintos; **eosinófilo** como célula nueva. Mecánica de zona: la microbiota amiga no se debe dañar.
- [ ] **Zona 4, la sangre:** el flujo arrastra; sepsis y leucemia.
- [ ] **Zona 5, el ganglio linfático:** VIH (convierte aliados en enemigos) y linfoma.
- [ ] **Armas intercambiables** dentro de la partida (como en Soul Knight): distintos gránulos, anticuerpos IgM o IgA, etc.
- [ ] **Sala de tienda** con "antígenos" como moneda y **eventos especiales** (vacuna, fiebre, antibiótico).

## Fase 3. Calidad
- [ ] Arte hecho a mano: hojas de sprites con animación de caminar, atacar y morir (Aseprite o LibreSprite) que reemplacen las texturas generadas en `src/gfx/sprites.js` usando la misma clave.
- [ ] Música compuesta por zona y mezcla de volumen (música y efectos por separado en Ajustes).
- [ ] Tutorial breve en la primera partida.
- [ ] Guardado en la nube (opcional, más adelante).

## Fase 4. Apps nativas
- **Android/iOS: Capacitor**
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/android
  npx cap init Inmune com.mizra.inmune --web-dir=dist
  npm run build && npx cap add android && npx cap sync
  npx cap open android   # abre Android Studio para generar el APK/AAB
  ```
  Bloquear la orientación horizontal, quitar la barra de estado y publicar en Google Play (cuenta de desarrollador de 25 USD, pago único). iOS requiere una Mac y la cuenta de Apple (99 USD al año).
- **PC: Electron o Tauri** para generar un `.exe` y publicar en **Steam** o itch.io.

## Fase 5. Comunidad y lanzamiento
- [ ] Página en itch.io con capturas y GIFs; probarlo con estudiantes de medicina y biología (su lado educativo es un gran atractivo).
- [ ] Recoger opiniones, ajustar dificultad y balance.
- [ ] Modelo de negocio: gratis con un pago opcional (por ejemplo, desbloquear zonas), o un precio único bajo.

## Cómo usar este archivo con Claude
Sube `CLAUDE.md`, `docs/GDD.md` y este `docs/ROADMAP.md` a tu proyecto de Claude. Para programar, abre la carpeta del repositorio con Claude Code y pide, por ejemplo:
> "Lee CLAUDE.md y docs/ROADMAP.md. Hagamos la primera tarea pendiente de la Fase 1. Dime el plan antes de cambiar nada."
