import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Single-bundle local demo; Leaflet + React push it just past the default 500 kB warning.
  build: { chunkSizeWarningLimit: 800 },
});
