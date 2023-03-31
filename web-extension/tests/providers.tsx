import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { I18nProvider } from '@lingui/react'
import React from 'react'
import { Router } from 'wouter'

import { gqlSchema } from '../../backend/schemas/gqlSchema'
import { i18n } from '@lingui/core'
import staticLocationHook from 'wouter/static-location'

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
export const wrapInFEProviders = (
  jsx: JSX.Element,
  client: ApolloClient<any>
) => {
  return (
    <ApolloProvider client={client}>
      <I18nProvider i18n={i18n}>
        <Router hook={staticLocationHook('/')}>{jsx}</Router>
      </I18nProvider>
    </ApolloProvider>
  )
}
