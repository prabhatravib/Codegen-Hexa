import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
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
                main: resolve(__dirname, 'index.html'),
                worker: resolve(__dirname, 'src/worker-voice/index.ts')
            },
            output: {
                entryFileNames: function (chunkInfo) {
                    return chunkInfo.name === 'worker' ? 'worker.js' : '[name].js';
                }
            }
        }
    },
    worker: {
        format: 'es'
    }
});
