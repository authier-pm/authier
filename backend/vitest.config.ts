import path from 'node:path/posix'
import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    // @ts-expect-error
    swc.vite(),
    // @ts-expect-error
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
      '.prisma/client': path.resolve(
        __dirname,
        './node_modules/.prisma/client'
      ),
      stripe: path.resolve(
        __dirname,
        '../node_modules/stripe/cjs/stripe.cjs.node.js'
      )
    }
  }
})
