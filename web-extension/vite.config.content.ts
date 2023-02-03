import { defineConfig } from 'vite'
import { sharedConfig } from './vite.config'
import packageJson from './package.json'

import { isDev, r } from './scripts/utils'

// bundling the content script using Vite
export default defineConfig({
  ...sharedConfig,
  define: {
    __DEV__: isDev,
    // https://github.com/vitejs/vite/issues/9320
    // https://github.com/vitejs/vite/issues/9186
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production')
  },
  build: {
    watch: isDev ? {} : undefined,
    outDir: r('dist/js'),
    cssCodeSplit: false,
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    lib: {
      entry: r('src/content-script/contentScript.ts'),
      name: packageJson.name,
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.global.js',
        extend: true
      }
    }
  }
})
