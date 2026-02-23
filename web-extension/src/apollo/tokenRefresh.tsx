import { ApolloLink } from '@apollo/client'
import { Observable } from 'rxjs'
import { accessToken, setAccessToken } from '../util/accessTokenExtension'
import { JwtPayload, jwtDecode } from 'jwt-decode'
import { API_URL } from './API_URL'
import { device } from '@src/background/ExtensionDevice'

const tokenRefreshBaseUrl = API_URL?.replace('/graphql', '')

let isRefreshing = false
let pendingCallbacks: Array<() => void> = []

const isTokenValid = async (): Promise<boolean> => {
  if (!accessToken) return false
  try {
    const { exp } = jwtDecode<JwtPayload & { exp: number }>(accessToken)
    return Date.now() < exp * 1000
  } catch (error) {
    console.error(error)
    return false
  }
}

const fetchAndApplyNewToken = async (): Promise<void> => {
  const url = `${tokenRefreshBaseUrl}/refresh_token`
  const response = await fetch(url, { method: 'POST', credentials: 'include' })
  const data = await response.json()
  setAccessToken(data.accessToken)
}

export const tokenRefresh = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let sub: { unsubscribe(): void } | undefined

    const proceed = () => {
      sub = forward(operation).subscribe({
        next: (v) => observer.next(v),
        error: (e) => observer.error(e),
        complete: () => observer.complete()
      })
    }

    isTokenValid().then((valid) => {
      if (valid) {
        proceed()
        return
      }

      if (isRefreshing) {
        pendingCallbacks.push(proceed)
        return
      }

      isRefreshing = true
      fetchAndApplyNewToken()
        .then(() => {
          isRefreshing = false
          pendingCallbacks.forEach((cb) => cb())
          pendingCallbacks = []
          proceed()
        })
        .catch(async (err) => {
          isRefreshing = false
          pendingCallbacks = []
          console.error('Error during token refresh:', err)
          console.log('Your refresh token is likely invalid. Logging out.')
          await device.clearAndReload()
          observer.error(err)
        })
    })

    return () => {
      sub?.unsubscribe()
    }
  })
})
