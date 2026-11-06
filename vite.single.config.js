import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build en un solo archivo HTML (JS, fuentes y estilos incrustados),
// para compartir o abrir el juego sin servidor.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { outDir: 'dist-single', chunkSizeWarningLimit: 3000 },
});
