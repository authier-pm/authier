import 'reflect-metadata'
import { buildSchemaSync } from 'type-graphql'
import { RecipeResolver } from './resolvers'

export const schema = buildSchemaSync({
  resolvers: [RecipeResolver]
})
