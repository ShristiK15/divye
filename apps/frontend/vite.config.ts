import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      shared: path.resolve(__dirname, '../../packages/shared/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['@divye/shared'],
  },
  server: {
    port: 5173,
  },
});
