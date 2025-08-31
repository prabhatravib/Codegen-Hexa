import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './apps/frontend/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'apps/frontend/index.html'),
        worker: resolve(__dirname, 'apps/frontend/src/worker-voice/index.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'worker' ? 'worker.js' : '[name].js'
        }
      }
    }
  },
  worker: {
    format: 'es'
  },
  define: {
    'import.meta.env.VITE_PUBLIC_BACKEND_URL': JSON.stringify(process.env.VITE_PUBLIC_BACKEND_URL || 'https://codegen-hexa-backend.prabhatravib.workers.dev')
  }
})
