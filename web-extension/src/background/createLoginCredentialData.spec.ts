import { createLoginCredentialData } from './createLoginCredentialData'

describe('createLoginCredentialData', () => {
  it('uses the captured username consistently in the username and label', () => {
    expect(
      createLoginCredentialData({
        fallbackUsername: 'vault-owner@example.com',
        favIconUrl: 'https://bsky.app/favicon.ico',
        hostname: 'bsky.app',
        password: 'generated-password',
        username: 'person@example.com'
      })
    ).toEqual({
      username: 'person@example.com',
      password: 'generated-password',
      iconUrl: 'https://bsky.app/favicon.ico',
      url: 'bsky.app',
      label: 'person@example.com | bsky.app'
    })
  })

  it('uses the fallback username in both fields when capture is null', () => {
    const credential = createLoginCredentialData({
      fallbackUsername: 'vault-owner@example.com',
      hostname: 'bsky.app',
      password: 'generated-password',
      username: null
    })

    expect(credential.username).toBe('vault-owner@example.com')
    expect(credential.label).toBe('vault-owner@example.com | bsky.app')
  })
})
