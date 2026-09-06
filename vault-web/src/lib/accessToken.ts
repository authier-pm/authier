let accessToken: string | null = null

// Remove credentials left by older releases; never restore them from disk.
export const purgeLegacyVaultCredentials = () => {
  if (typeof window === 'undefined') return
  for (const key of [
    'authier-vault-access-token',
    'authier-vault-refresh-token',
    'authier-vault-unlocked-state'
  ]) {
    window.localStorage.removeItem(key)
  }
}

export const getAccessToken = () => accessToken

export const setAccessToken = (token: string | null) => {
  purgeLegacyVaultCredentials()
  accessToken = token
}
