import path from 'node:path'
import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    swc.vite(),
    tsconfigPaths()
  ],

  test: {
    setupFiles: ['./tests/testEnv.ts'],
    deps: {
      interopDefault: true
    }
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.cjs'], // by default vite also resolves mjs files, but we run in CJS mode so we don't want to load ESM modules

    alias: {
      stripe: path.resolve(
        __dirname,
        '../node_modules/stripe/cjs/stripe.cjs.node.js'
      )
    }
  }
})
