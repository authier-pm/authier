import { build } from 'esbuild'
import { esbuildDecorators } from '@anatine/esbuild-decorators'
import esbuildFileLocPlugin from './esbuildFileLocPlugin'
;(async () => {
  await build({
    entryPoints: ['server.ts'],
    bundle: true,
    tsconfig: 'tsconfig.json',
    outfile: 'dist/server.js',
    platform: 'node',
    target: 'node16',
    plugins: [
      esbuildDecorators({
        tsconfig: 'tsconfig.json',
        cwd: process.cwd()
      }),
      esbuildFileLocPlugin('/app')
    ],
    sourcemap: true
  })

  console.log('Build complete')
})()
