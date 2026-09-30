import {
  LoginSessionError,
  resumeRememberedDevice
} from '@src/background/loginSession'
import { ApolloLink } from '@apollo/client'
import { Observable } from 'rxjs'
import { getAccessToken, setAccessToken } from '../util/accessTokenExtension'
import { JwtPayload, jwtDecode } from 'jwt-decode'
import { API_URL } from './API_URL'
import { device } from '@src/background/ExtensionDevice'

const tokenRefreshBaseUrl = API_URL?.replace('/graphql', '')

let pendingRefresh: Promise<void> | undefined

const isTokenValid = async (): Promise<boolean> => {
  const accessToken = await getAccessToken()
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
  if (response.status >= 500 || response.status === 429) {
<<<<<<< HEAD
<<<<<<< HEAD
    throw new Error(
      `Unable to refresh the Authier session (${response.status})`
    )
=======
    throw new Error(`Unable to refresh the Authier session (${response.status})`)
>>>>>>> dbc82009 (Preserve vault data during session renewal failures)
=======
    throw new Error(
      `Unable to refresh the Authier session (${response.status})`
    )
>>>>>>> 65b78314 (Harden offline vault behavior and add multilingual SMS model experiments)
  }
  const data = await response.json()
  if (response.ok && typeof data.accessToken === 'string') {
    await setAccessToken(data.accessToken)
    return
  }
  await resumeRememberedDevice()
}

const refreshToken = () => {
  pendingRefresh ??= fetchAndApplyNewToken()
    .catch(async (error: unknown) => {
      console.error('Error during token refresh:', error)
      if (error instanceof LoginSessionError && !error.retryable) {
        await device.clearAndReload()
      }
      throw error
    })
    .finally(() => {
      pendingRefresh = undefined
    })
  return pendingRefresh
}

export const tokenRefresh = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    let sub: { unsubscribe(): void } | undefined

    const proceed = () => {
      if (observer.closed) return
      sub = forward(operation).subscribe({
        next: (v) => observer.next(v),
        error: (e) => observer.error(e),
        complete: () => observer.complete()
      })
    }

    isTokenValid()
      .then(async (valid) => {
        if (!valid) await refreshToken()
        proceed()
      })
      .catch((error: unknown) => observer.error(error))

    return () => {
      sub?.unsubscribe()
    }
  })
})
