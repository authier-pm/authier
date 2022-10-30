import { onError } from '@apollo/client/link/error'
import 'react-toastify/dist/ReactToastify.css'
import { toast } from 'react-toastify'
import { print } from 'graphql'
//@ts-ignore
import { device } from '@src/background/ExtensionDevice'

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

      //FIX: Does the toast even work from here?
      toast.error(graphQLErrors[0].message ?? 'There was API error.')
    } else if (networkError) {
      console.error(`[Network error]: ${networkError}`)
      toast.error('There was network error.')
    }
  }
)
