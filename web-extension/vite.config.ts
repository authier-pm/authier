import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom'
    // setupFiles: '../tests/setupTests.ts'
  },
  plugins: [tsconfigPaths()],
  root: './src'
})
