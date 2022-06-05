const cpy = require('cpy')

// tsc only produces js files, so we need to copy other filetypes
;(async () => {
  const r = await cpy(
    [
      '**/*.sql',
      '**/*.pem',
      '**/*.graphql',
      '**/*.key',
      '**/*.crt',
      '**/*.prisma'
      // 'captain-definition',
      // 'Dockerfile'
    ],
    './dist',
    {
      parents: true,
      ignore: ['./dist', './cdk.out', './node_modules/**']
    }
  )

  await cpy(
    ['../node_modules/mercurius/static/*'],
    './dist/node_modules/mercurius/static',
    {
      parents: false
    }
  )

  await cpy(['../node_modules/@prisma/client/**'], './dist/node_modules', {
    parents: true
  })

  await cpy(['../node_modules/prisma/**'], './dist/node_modules', {
    parents: true
  })

  await cpy(['../node_modules/.prisma/**'], './dist/node_modules', {
    parents: true
  })
  await cpy(['../node_modules/vm2/**'], './dist/node_modules', {
    parents: true
  })

  console.log(`${r.length} files copied!`)
  // await Promise.all([moveFile('node_modules', '../dist/back-end/node_modules')])
})()

// and we need to move node_modules
