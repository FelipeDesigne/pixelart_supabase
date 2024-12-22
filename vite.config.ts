import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Pixel Art',
        short_name: 'PixelArt',
        description: 'Crie e compartilhe pixel arts incríveis',
        theme_color: '#142830',
        background_color: '#142830',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/PixelArt/',
        scope: '/PixelArt/',
        icons: [
          {
            src: '/PixelArt/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/PixelArt/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/PixelArt/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5174,
    host: '0.0.0.0'
  }
});
