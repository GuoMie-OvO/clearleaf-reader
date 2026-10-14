import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'chrome132',
    rollupOptions: {
      input: { main: resolve('index.html'), preview: resolve('reader-preview.html') },
    },
  },
});
