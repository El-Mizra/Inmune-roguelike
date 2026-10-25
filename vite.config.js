import { defineConfig } from 'vite';

// base './' permite servir el build desde cualquier carpeta
// (GitHub Pages, itch.io o empaquetado como app con Capacitor).
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
