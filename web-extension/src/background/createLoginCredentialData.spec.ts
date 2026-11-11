import { createLoginCredentialData } from './createLoginCredentialData'

describe('createLoginCredentialData', () => {
  it('uses the captured username consistently in the username and label', () => {
    expect(
      createLoginCredentialData({
        fallbackUsername: 'vault-owner@example.com',
        favIconUrl: 'https://bsky.app/favicon.ico',
        pageUrl: new URL('https://bsky.app/login'),
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
      pageUrl: new URL('https://bsky.app/login'),
      password: 'generated-password',
      username: null
    })

    expect(credential.username).toBe('vault-owner@example.com')
    expect(credential.label).toBe('vault-owner@example.com | bsky.app')
  })

  it('keeps plain http, so the login is offered on that page again', () => {
    const credential = createLoginCredentialData({
      fallbackUsername: 'vault-owner@example.com',
      pageUrl: new URL('http://192.168.1.1/login.cgi'),
      password: 'router-password',
      username: 'admin'
    })

    expect(credential.url).toBe('http://192.168.1.1')
    expect(credential.label).toBe('admin | 192.168.1.1')
  })
})
