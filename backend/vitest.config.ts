import swc from 'unplugin-swc'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    swc.vite()
  ],
  test: {
    setupFiles: ['./tests/testEnv.ts']
  }
})
