import 'dotenv/config'
import { printSchema } from 'graphql'
import fs from 'mz/fs'
import prettier from 'prettier'

import { gqlSchema } from '../schemas/gqlSchema'
;(async () => {
  await fs.writeFile(
    './gqlSchemas/authier.graphql',
    prettier.format(printSchema(gqlSchema), { parser: 'graphql' })
  )
  console.log('✅ backend schema written')
})()
