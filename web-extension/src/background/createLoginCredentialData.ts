type CreateLoginCredentialDataInput = {
  fallbackUsername: string
  favIconUrl?: string | null
  hostname: string
  password: string
  username: string | null
}

export const createLoginCredentialData = ({
  fallbackUsername,
  favIconUrl,
  hostname,
  password,
  username
}: CreateLoginCredentialDataInput) => {
  const resolvedUsername = username ?? fallbackUsername

  return {
    username: resolvedUsername,
    password,
    iconUrl: favIconUrl ?? null,
    url: hostname,
    label: `${resolvedUsername} | ${hostname}`
  }
}
