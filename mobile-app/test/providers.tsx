import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import React from 'react'
import { NativeBaseProvider } from 'native-base'
//@ts-expect-error
import { gqlSchema } from 'gqlSchemas'

export const makeSsrClient = (ctx: any) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    ssrMode: true,
    link: new SchemaLink({
      schema: gqlSchema,
      context: ctx
    })
  })
}

/**
 * almost all of our FE components need these providers
 */
export const wrapInProviders = (
  jsx: JSX.Element,
  client: ApolloClient<any>
) => {
  const inset = {
    frame: { x: 0, y: 0, width: 0, height: 0 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 }
  }

  return (
    <ApolloProvider client={client}>
      <NativeBaseProvider initialWindowMetrics={inset}>
        {jsx}
      </NativeBaseProvider>
    </ApolloProvider>
  )
}
