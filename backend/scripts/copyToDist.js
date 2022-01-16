const cpy = require('cpy')

// tsc only produces js files, so we need to copy other filetypes
;(async () => {
  const c1 = await cpy(
    [
      '**/*.sql',
      '**/*.pem',
      '**/*.graphql',
      '**/*.key',
      '**/*.crt',
      '**/*.prisma',
      'captain-definition',
      'package.json',
      'Dockerfile',
      'node_modules/.prisma/client/**',
      'node_modules/.bin/prisma' // needed for migrations
    ],
    './dist',
    {
      parents: true,
      ignore: ['./dist']
    }
  )

  const c2 = await cpy(
    ['../node_modules/mercurius/static/*'],
    './dist/node_modules/mercurius/static',
    {
      parents: false
    }
  )

  const c3 = await cpy(
    ['../node_modules/prisma', '../node_modules/@prisma'],
    './dist/node_modules',
    {
      parents: true
    }
  )

  console.log(`${c1.length} | ${c2.length} | ${c3.length} files copied!`)
  // await Promise.all([moveFile('node_modules', '../dist/back-end/node_modules')])
})()

// and we need to move node_modules
