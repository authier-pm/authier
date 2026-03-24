import { defineConfig, type Plugin } from 'vitest/config'
import path from 'path'
// Using dynamic import for ES modules
// import react from '@vitejs/plugin-react'
// import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Custom vite plugin to run @lingui/babel-plugin-lingui-macro on .ts/.tsx files.
 * Needed because @vitejs/plugin-react v6+ uses oxc instead of babel,
 * so the babel plugins option is no longer supported.
 */
function linguiBabelTransform(): Plugin {
  return {
    name: 'lingui-babel-transform',
    enforce: 'pre',
    async transform(code, id) {
      if (!/\.[jt]sx?$/.test(id) || /node_modules/.test(id)) return null
      if (
        !code.includes('@lingui/core/macro') &&
        !code.includes('@lingui/react/macro')
      )
        return null

      const babel = await import('@babel/core')
      const result = await babel.transformAsync(code, {
        filename: id,
        plugins: ['@lingui/babel-plugin-lingui-macro'],
        parserOpts: {
          plugins: ['typescript', 'jsx']
        },
        sourceType: 'module',
        // Ignore babel.config.js to avoid @babel/preset-env converting ESM to CJS
        configFile: false,
        babelrc: false,
        sourceMaps: true
      })
      return result ? { code: result.code!, map: result.map } : null
    }
  }
}

export default async function () {
  // Dynamically import ES modules
  const [{ default: tsconfigPaths }, { default: react }] = await Promise.all([
    import('vite-tsconfig-paths'),
    import('@vitejs/plugin-react')
  ])

  return defineConfig({
    plugins: [
      linguiBabelTransform(),
      react(),
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
