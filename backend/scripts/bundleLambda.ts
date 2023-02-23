import { build } from 'esbuild'
import { esbuildDecorators } from '@anatine/esbuild-decorators'
import esbuildFileLocPlugin from './esbuildFileLocPlugin'

import isCi from 'is-ci'
import path from 'path'
;(async () => {
  const parentFolderAtRuntime = isCi
    ? '/var/task'
    : path.resolve(process.cwd(), '..')
  console.log('parentFolderAtRuntime', parentFolderAtRuntime)
  await build({
    entryPoints: ['lambda.ts'],
    bundle: true,
    tsconfig: 'tsconfig.json',
    outfile: 'dist/lambda.js',
    external: ['aws-sdk', '@prisma/client', 'knex', 'pg-native', 'stripe'],
    platform: 'node',
    target: 'node18',
    plugins: [
      esbuildDecorators({
        tsconfig: 'tsconfig.json',
        cwd: process.cwd()
      }),
      esbuildFileLocPlugin(parentFolderAtRuntime)
    ],
    sourcemap: true
  })

  console.log('Build complete')
})()
