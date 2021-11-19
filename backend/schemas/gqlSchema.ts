import 'reflect-metadata'
import { buildSchemaSync } from 'type-graphql'
import { RootResolver } from '../schemas/RootResolver'

export const gqlSchema = buildSchemaSync({
  resolvers: [RootResolver]
})
