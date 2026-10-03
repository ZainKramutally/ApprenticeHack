import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Local demo: the app bundle is ~550 kB and MapLibre (lazy-loaded with the first map) is ~1 MB on its own.
  build: { chunkSizeWarningLimit: 1100 },
});
