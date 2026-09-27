import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { linguiBabelTransform } from './vite/linguiBabelTransform.mts'

export default defineConfig({
  plugins: [linguiBabelTransform(), react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.ts'],
    include: ['./src/**/*.spec.ts', './src/**/*.spec.tsx'],
    exclude: ['node_modules', 'dist', 'playwright-report', 'test-results'],
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
      '@util': path.resolve(__dirname, './src/util'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
})
