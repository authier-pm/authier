const cpy = require('cpy')

// tsc only produces js files, so we need to copy other filetypes
;(async () => {
  const r = await cpy(
    [
      'package.json',
      'package-lock.json',

      '**/*.json',
      '**/*.tpl',
      '**/*.ejs',
      '**/*.html',
      '**/*.toml',
      '**/*.sql',
      '**/*.pem',
      '**/*.graphql',
      '**/*.key',
      '**/*.crt',
      '**/*.prisma',
      'captain-definition'
    ],
    './dist',
    { parents: true, ignore: ['./dist', 'node_modules'] }
  )

  console.log(`${r.length} files copied!`)
  // await Promise.all([moveFile('node_modules', '../dist/back-end/node_modules')])
})()

// and we need to move node_modules
