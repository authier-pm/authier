import { onError } from '@apollo/client/link/error'
import { toastifyConfig } from './toastifyConfig'
import { toast } from 'react-toastify'

// Log any GraphQL errors or network error that occurred
export const errorLink = onError(({ graphQLErrors, networkError }) => {
  const isExtension = window.location.href.startsWith('chrome-extension')

  toast.configure(toastifyConfig(isExtension ? undefined : 'bottom-right'))
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) => {
      console.error(JSON.stringify(locations))
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    })
    toast.error('There was API error.')
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`)
    toast.error('There was network error.')
  }
})
