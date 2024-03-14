import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { SchemaLink } from '@apollo/client/link/schema'
import { I18nProvider } from '@lingui/react'
import React from 'react'
import { Router } from 'wouter'

// import { gqlSchema } from '../../backend/schemas/gqlSchema'
const gqlSchemas = require('../../backend/schemas/gqlSchema').gqlSchema // we need to require it because when we use regular import typescript starts to compile whole BE codebase with extensions config
import { memoryLocation } from 'wouter/memory-location'
import { i18n } from '@lingui/core'

const locationHook = memoryLocation({ path: '/', static: true, record: true })

export const makeSsrClient = (ctx: any) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    ssrMode: true,
    link: new SchemaLink({
      schema: gqlSchemas,
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
        <Router hook={locationHook.hook}>{jsx}</Router>
      </I18nProvider>
    </ApolloProvider>
  )
}
