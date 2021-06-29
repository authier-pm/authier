import 'dotenv/config'
import { printSchema } from 'graphql'
import fs from 'mz/fs'

import { schema } from '../../server/schemas/schema'
;(async () => {
  await Promise.all([
    fs.writeFile('./gqlSchemas/authier.graphql', printSchema(schema))
  ])
})()
