import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` lève une erreur hors du runtime serveur de Next.js : neutralisé en test.
      'server-only': path.resolve(__dirname, 'tests/support/empty-module.ts'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['tests/support/env.ts'],
    globalSetup: ['tests/support/global-setup.ts'],
    // Les tests d'intégration partagent une base : exécution séquentielle.
    fileParallelism: false,
    testTimeout: 20_000,
  },
})
