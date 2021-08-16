import 'reflect-metadata'
import { buildSchemaSync } from 'type-graphql'
import { RootResolver } from '../RootResolver'

export const gqlSchema = buildSchemaSync({
  resolvers: [RootResolver]
})
