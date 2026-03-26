const ACCESS_TOKEN_STORAGE_KEY = 'authier-vault-access-token'

let accessToken: string | null = null

const readStoredAccessToken = () =>
  typeof window === 'undefined'
    ? null
    : window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)

export const getAccessToken = () => accessToken ?? readStoredAccessToken()

export const setAccessToken = (token: string | null) => {
  accessToken = token

  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
}
