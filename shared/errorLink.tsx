import { onError } from '@apollo/client/link/error'
import { print } from 'graphql'
//@ts-ignore
import { device } from '../background/ExtensionDevice'
import { toast } from '../web-extension/src/ExtensionProviders'

// Log any GraphQL errors or network error that occurred
export const errorLink = onError(
  ({ graphQLErrors, networkError, operation }) => {
    if (graphQLErrors) {
      if (graphQLErrors[0].message === 'not authenticated') {
        //Here just logout the user
        device.clearAndReload()
      }
      graphQLErrors.map(({ message, path }) => {
        console.error(
          `[GraphQL error]: Message: ${message}, operation: ${operation.operationName}, Path: ${path}`
        )
        console.error('full operation: ', print(operation.query))
      })

      toast({
        title: graphQLErrors[0].message ?? 'There was API error.',
        status: 'warning',
        isClosable: true
      })
    } else if (networkError) {
      console.error(`[Network error]: ${networkError}`)
      console.error('operation', operation)

      toast({
        title: 'There was network error.',
        status: 'error',
        isClosable: true
      })
    }
  }
)
