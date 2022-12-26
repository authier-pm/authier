import path from 'node:path/posix'
import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    // Vite plugin
    swc.vite(),
    tsconfigPaths({
      projects: [
        'backend/tsconfig.json',
        'web-extension/tsconfig.json',
        'mobile-app/tsconfig.json'
      ]
    })
  ],

  test: {
    setupFiles: ['./backend/tests/testEnv.ts'],
    deps: {
      interopDefault: true
    },
    exclude: ['**/node_modules/**', '**/e2e-tests/**', '**/dist/**']
  },
  resolve: {
    alias: {
      '.prisma/client': path.resolve(
        __dirname,
        './backend/node_modules/.prisma/client'
      )
    }
  }
})
