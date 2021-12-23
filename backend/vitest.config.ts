import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { esbuildDecorators } from '@anatine/esbuild-decorators'

const plugin = esbuildDecorators({
  force: true
})
console.log('~ plugin', plugin.setup.toString())

export default defineConfig({
  test: {
    testTimeout: 5000,
    // threads: false,
    setupFiles: ['./test/jestEnv.ts', './test/jestSetup.ts']
  },
  esbuild: {},

  optimizeDeps: {
    esbuildOptions: {
      plugins: [plugin]
    }
  }

  //   plugins: [
  //     react({
  //       babel: {
  //         plugins: [
  //           ['@babel/plugin-proposal-decorators', { legacy: true }],
  //           ['@babel/plugin-proposal-class-properties', { loose: true }]
  //         ]
  //       }
  //     })
  //   ]
})
