import cpy from '@cjsa/cpy'

const relativePath = './node_modules'

const modulesToCopy = [
  'qs',
  'side-channel',
  'call-bind',
  'function-bind',
  'get-intrinsic',
  'object-inspect',
  'has',
  'has-symbols',
  'farmhash'
]

// copies all node_modules needed for lambda as prisma generated files are not bundled
;(async () => {
  await cpy(
    [
      `../node_modules/.prisma/client/**`,
      `!**/libquery_engine-debian-*`,
      `!**/libquery_engine-rhel-*`
    ],
    'dist/node_modules/.prisma/client'
  )
  await cpy(
    [`../node_modules/@prisma/client/**`],
    'dist/node_modules/@prisma/client'
  )

  for (const mod of modulesToCopy) {
    const res = await cpy(
      [`.${relativePath}/${mod}/**`], // going one directory up is needed, because pnpm only stores the node_modules in the root
      `dist/node_modules/${mod}`
    )
    console.log(`Copied ${res.length} files for ${mod}`)
  }

  await cpy(
    [
      `${relativePath}/@prisma/**`,
      `!**/libquery_engine-debian-*`,
      `!**/libquery_engine-rhel-*`
      // there should be only libquery_engine-linux-arm64-openssl-1.0.x.so left
    ],
    'dist/node_modules/@prisma'
  )

  await cpy(['./prisma/schema.prisma'], './dist/node_modules/.prisma/client')
  await cpy(['./prisma/schema.prisma'], './dist/node_modules/@prisma/client')

  console.log(`Prisma client files copied!`)
})()
