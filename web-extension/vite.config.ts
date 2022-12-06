// vite.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom'
    // setupFiles: '../tests/setupTests.ts'
  },
  root: './src'
})
