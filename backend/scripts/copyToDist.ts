import cpy from '@cjsa/cpy'

const relativePath = './node_modules'

const modulesToCopy = ['pg', 'prisma', 'xtend', 'split2', 'pgpass', 'stripe']

// copies all node_modules needed for lambda as prisma generated files are not bundled
;(async () => {
  await cpy([`${relativePath}/@prisma/**`], 'dist/node_modules/@prisma')

  await cpy([`${relativePath}/pg-*/**`], `dist/node_modules`) // needed for knex
  await cpy([`${relativePath}/postgres-*/**`], `dist/node_modules`) // needed for knex

  for (const mod of modulesToCopy) {
    await cpy([`${relativePath}/${mod}/**`], `dist/node_modules/${mod}`)
    console.log(`${mod} module copied!`)
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
