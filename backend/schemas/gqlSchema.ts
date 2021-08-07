import 'reflect-metadata'
import { buildSchemaSync } from 'type-graphql'
import { RootResolver } from '../resolvers'

export const gqlSchema = buildSchemaSync({
  resolvers: [RootResolver]
})
