import 'dotenv/config'
import { printSchema } from 'graphql'
import fs from 'fs/promises'
import prettier from 'prettier'

import { gqlSchema } from '../schemas/gqlSchema'
;(async () => {
  await fs.writeFile(
    './gqlSchemas/authier.graphql',
    await prettier.format(printSchema(gqlSchema), { parser: 'graphql' })
  )
  console.log('✅ backend schema written')
})()
