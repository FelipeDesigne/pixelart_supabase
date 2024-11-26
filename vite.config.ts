import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/PixelArt/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
