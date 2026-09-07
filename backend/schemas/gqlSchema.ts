import 'reflect-metadata'
import { buildSchemaSync } from 'type-graphql'
import { RootResolver } from './RootResolver'

// GraphQL checks input shapes and scalars. Our input classes do not require
// class-validator decorators; 0.14 otherwise rejects them as unknown values.
// Keep explicit decorator constraints active, matching the pre-0.14 behavior.
export const graphqlValidationOptions = { forbidUnknownValues: false }

export const gqlSchema = buildSchemaSync({
  resolvers: [RootResolver],
  validate: graphqlValidationOptions
})
