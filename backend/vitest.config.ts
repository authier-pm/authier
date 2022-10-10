import path from 'node:path/posix'
import swc from 'unplugin-swc'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    swc.vite()
  ],
  test: {
    setupFiles: ['./tests/testEnv.ts']
  },
  resolve: {
    alias: {
      '.prisma/client': path.resolve(
        __dirname,
        '../node_modules/.prisma/client'
      )
    }
  }
})
