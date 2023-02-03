import { defineConfig, UserConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import path, { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'

export const port = parseInt(process.env.PORT || '') || 3303
export const r = (...args: string[]) => resolve(__dirname, '..', ...args)
export const isDev = process.env.NODE_ENV !== 'production'

export const sharedConfig: UserConfig = {
  root: r('src'),
  resolve: {
    alias: {
      '~/': `${r('src')}/`
    }
  },

  plugins: [
    AutoImport({
      imports: [
        {
          'webextension-polyfill': [['*', 'browser']]
        }
      ]
    }),

    // https://github.com/antfu/unplugin-icons
    Icons()
  ],
  optimizeDeps: {
    include: ['webextension-polyfill']
  }
}

export default defineConfig({
  ...sharedConfig,
  test: {
    globals: true,
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      react: path.resolve('../node_modules/react'),
      '@emotion/react': path.resolve('../node_modules/@emotion/react'),
      '@emotion/core': path.resolve('../node_modules/@emotion/core'),
      '@src': path.resolve(__dirname, 'src/'),
      '@shared': path.resolve(__dirname, '../shared/'),
      '@util': path.resolve(__dirname, 'src/util/')
    }
  },
  plugins: [tsconfigPaths()],
  root: './src',
  define: {
    'process.env': {}
  },
  build: {
    sourcemap: isDev ? 'inline' : false,
    outDir: '../dist/js',
    rollupOptions: {
      input: {
        backgroundPage: path.join(
          __dirname,
          'src/background/backgroundPage.ts'
        ),
        popup: path.join(__dirname, 'src/index.tsx'),
        vault: path.join(__dirname, 'src/vault-index.tsx'),
        contentScript: path.join(
          __dirname,
          'src/content-script/contentScript.ts'
        )
      },
      output: {
        // Change name of output files
        entryFileNames: '[name].js',
        // change path of output files
        dir: '../dist/js'
      }
    },
    terserOptions: {
      mangle: false
    },
    emptyOutDir: false
  }
})
