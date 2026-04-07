const UNAUTHORIZED_SESSION_EVENT = 'authier:unauthorized-session'

export const notifyUnauthorizedSession = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(UNAUTHORIZED_SESSION_EVENT))
}

export const onUnauthorizedSession = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener(UNAUTHORIZED_SESSION_EVENT, listener)

  return () => {
    window.removeEventListener(UNAUTHORIZED_SESSION_EVENT, listener)
  }
}
