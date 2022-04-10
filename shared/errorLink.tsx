import { onError } from '@apollo/client/link/error'
import { toastifyConfig } from './toastifyConfig'
import { toast } from 'react-toastify'
import { print } from 'graphql'
import { device } from '@src/background/ExtensionDevice'

// Log any GraphQL errors or network error that occurred
export const errorLink = onError(
  ({ graphQLErrors, networkError, operation }) => {
    const isExtension = window.location.href.startsWith('chrome-extension')

    toast.configure(toastifyConfig(isExtension ? undefined : 'bottom-right'))

    if (graphQLErrors) {
      if (graphQLErrors[0].message === 'not authenticated') {
        //Here just logout the user
        device.logout(true)
      }
      graphQLErrors.map(({ message, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, operation: ${operation.operationName}, Path: ${path}`
        )
        console.error('full operation: ', print(operation.query))
      })

      toast.error(graphQLErrors[0].message ?? 'There was API error.')
    } else if (networkError) {
      console.error(`[Network error]: ${networkError}`)
      toast.error('There was network error.')
    }
  }
)
