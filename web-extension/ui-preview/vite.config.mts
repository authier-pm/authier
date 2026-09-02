import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const previewDirectory = fileURLToPath(new URL('.', import.meta.url))
const extensionDirectory = fileURLToPath(new URL('..', import.meta.url))
const repositoryDirectory = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
  root: previewDirectory,
  cacheDir: fileURLToPath(
    new URL('../node_modules/.vite/ui-preview', import.meta.url)
  ),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@src/providers/DeviceStateProvider',
        replacement: fileURLToPath(
          new URL('./deviceStateProvider.tsx', import.meta.url)
        )
      },
      {
        find: 'webextension-polyfill',
        replacement: fileURLToPath(new URL('./browserMock.ts', import.meta.url))
      },
      {
        find: '@src',
        replacement: fileURLToPath(new URL('../src', import.meta.url))
      }
    ]
  },
  css: {
    postcss: extensionDirectory
  },
  server: {
    host: '127.0.0.1',
    port: 4174,
    strictPort: true,
    fs: {
      allow: [repositoryDirectory]
    }
  }
})
