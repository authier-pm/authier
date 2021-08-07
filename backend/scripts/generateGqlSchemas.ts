import 'dotenv/config'
import { printSchema } from 'graphql'
import fs from 'mz/fs'

import { gqlSchema } from '../schemas/gqlSchema'
;(async () => {
  await Promise.all([
    fs.writeFile('./gqlSchemas/authier.graphql', printSchema(gqlSchema))
  ])
})()
