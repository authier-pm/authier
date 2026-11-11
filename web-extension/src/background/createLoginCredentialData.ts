type CreateLoginCredentialDataInput = {
  fallbackUsername: string
  favIconUrl?: string | null
  /** The document the login was typed into. */
  pageUrl: URL
  password: string
  username: string | null
}

export const createLoginCredentialData = ({
  fallbackUsername,
  favIconUrl,
  pageUrl,
  password,
  username
}: CreateLoginCredentialDataInput) => {
  const resolvedUsername = username ?? fallbackUsername
  const { protocol, hostname } = pageUrl

  return {
    username: resolvedUsername,
    password,
    iconUrl: favIconUrl ?? null,
    // A saved URL without a scheme counts as https, which plain-http pages do
    // not get. Keep the scheme so the login is offered on this page again.
    url: protocol === 'http:' ? `http://${hostname}` : hostname,
    label: `${resolvedUsername} | ${hostname}`
  }
}
