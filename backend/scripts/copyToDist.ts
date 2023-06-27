import cpy from '@cjsa/cpy'

const relativePath = './node_modules'

const modulesToCopy = [
  'stripe',
  'qs',
  'side-channel',
  'call-bind',
  'function-bind',
  'get-intrinsic',
  'object-inspect',
  'has',
  'has-proto', // needed by stripe
  'has-symbols'
]

// copies all node_modules needed for lambda as prisma generated files are not bundled
;(async () => {
  await cpy(
    [`${relativePath}/@prisma/client/**`],
    'dist/node_modules/@prisma/client'
  )

  await cpy([`${relativePath}/pg-*/**`], `dist/node_modules`) // needed for knex
  await cpy([`${relativePath}/postgres-*/**`], `dist/node_modules`) // needed for knex

  for (const mod of modulesToCopy) {
    const res = await cpy(
      [`.${relativePath}/${mod}/**`], // going one directory up is needed, because pnpm only stores the node_modules in the root
      `dist/node_modules/${mod}`
    )
    console.log(`Copied ${res.length} files for ${mod}`)
  }

  await cpy(
    [
      `${relativePath}/.prisma/**`,
      `!**/libquery_engine-debian-*`,
      `!**/libquery_engine-rhel-*`
      // there should be only libquery_engine-linux-arm64-openssl-1.0.x.so left
    ],
    'dist/node_modules/.prisma'
  )

  await cpy(['./prisma/schema.prisma'], './dist/node_modules/.prisma/client')

  console.log(`Prisma files copied!`)
})()
