import 'dotenv/config'
import { printSchema } from 'graphql'
import fs from 'node:fs/promises'
import prettier from 'prettier'
import { gqlSchema } from '../schemas/gqlSchema'

await fs.writeFile(
  new URL('../gqlSchemas/authier.graphql', import.meta.url),
  await prettier.format(printSchema(gqlSchema), { parser: 'graphql' })
)
console.log('Backend GraphQL schema generated')
