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
        emptyOutDir: false,
    },
    define: {
        'import.meta.env.VITE_PUBLIC_BACKEND_URL': JSON.stringify(process.env.VITE_PUBLIC_BACKEND_URL || 'https://codegen-hexa-backend.prabhatravib.workers.dev')
    }
});
