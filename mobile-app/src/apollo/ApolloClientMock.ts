import { ApolloClient, InMemoryCache } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { gqlSchema } from '../../../backend/schemas/gqlSchema'
//const gqlSchemas = require('../../backend/schemas/gqlSchema').gqlSchema

export const makeSsrClient = (ctx: any) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    ssrMode: true,
    link: new SchemaLink({
      // @ts-ignore
      schema: gqlSchema,
      context: ctx
    })
  })
}
