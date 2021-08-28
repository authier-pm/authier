import {
  ApolloClient,
  FetchPolicy,
  ErrorPolicy,
  ApolloClientOptions,
  InMemoryCache,
  ApolloProvider
} from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { I18nProvider } from '@lingui/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { gqlSchema } from '../../backend/schemas/gqlSchema'
import { i18n } from '@lingui/core'

export const makeSsrClient = (ctx) => {
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
export const wrapInFEProviders = (jsx: JSX.Element, client) => {
  return (
    <ApolloProvider client={client}>
      <I18nProvider i18n={i18n}>
        <MemoryRouter>{jsx}</MemoryRouter>
      </I18nProvider>
    </ApolloProvider>
  )
}
