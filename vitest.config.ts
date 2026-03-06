import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@shared': resolve(__dirname, './shared'),
      '@server': resolve(__dirname, './server'),
      '@client': resolve(__dirname, './client'),
    },
  },
});
