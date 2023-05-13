import path from 'node:path/posix'
import swc from 'unplugin-swc'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    swc.vite()
  ],

  test: {
    setupFiles: ['./tests/testEnv.ts'],
    deps: {
      interopDefault: true
    }
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'], // by default vite also resolves mjs files, but we run in CJS mode so we don't want to load ESM modules

    alias: {
      '.prisma/client': path.resolve(__dirname, './node_modules/.prisma/client')
    }
  }
})
