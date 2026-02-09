import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://seemynft.page',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    // Output consistent file names for easier server integration
    rollupOptions: {
      output: {
        entryFileNames: 'assets/membership-app.js',
        chunkFileNames: 'assets/membership-[name].js',
        assetFileNames: 'assets/membership-app.[ext]'
      }
    }
  },
  // Base path - adjust if app is served from a subdirectory
  base: './'
})
