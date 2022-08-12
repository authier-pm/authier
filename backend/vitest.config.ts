import swc from 'unplugin-swc'

import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    swc.vite()
  ],
  test: {
    setupFiles: ['./tests/testEnv.ts']
  }
})
