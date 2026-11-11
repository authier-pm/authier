let session = new AbortController()

/** Capture before asynchronous work so a lock cannot revive a stale response. */
export const contentVaultSignal = () => session.signal

export const invalidateContentVaultSession = () => {
  session.abort()
  session = new AbortController()
}
