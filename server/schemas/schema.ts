import 'reflect-metadata'
import { buildSchemaSync } from 'type-graphql'
import { RootResolver } from '../resolvers'

export const schema = buildSchemaSync({
  resolvers: [RootResolver]
})
