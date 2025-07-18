import { defineConfig } from 'vitest/config'
import path from 'path'
import { lingui } from '@lingui/vite-plugin'
// Using dynamic import for ES modules
// import react from '@vitejs/plugin-react'
// import tsconfigPaths from 'vite-tsconfig-paths'

export default async function () {
  // Dynamically import ES modules
  const [{ default: tsconfigPaths }, { default: react }] = await Promise.all([
    import('vite-tsconfig-paths'),
    import('@vitejs/plugin-react')
  ])

  return defineConfig({
    plugins: [
      lingui(),
      react({
        babel: {
          plugins: ['@lingui/babel-plugin-lingui-macro']
        }
      }),
      tsconfigPaths()
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/vitest.setup.ts'],
      include: ['./src/**/*.spec.ts', './src/**/*.spec.tsx'],
      exclude: ['node_modules', 'dist', 'playwright-report', 'test-results'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/setupTests.ts',
          'tests/vitest.setup.ts'
        ]
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
}
