import { build } from 'esbuild'
import { esbuildDecorators } from '@anatine/esbuild-decorators'
import esbuildFileLocPlugin from './esbuildFileLocPlugin'
;(async () => {
  await build({
    entryPoints: ['lambda.ts'],
    bundle: true,
    tsconfig: 'tsconfig.json',
    outfile: 'dist/lambda.js',
    platform: 'node',
    target: 'node16',
    plugins: [
      esbuildDecorators({
        tsconfig: 'tsconfig.json',
        cwd: process.cwd()
      }),
      esbuildFileLocPlugin('/var/task')
    ],
    sourcemap: true
  })

  console.log('Build complete')
})()
