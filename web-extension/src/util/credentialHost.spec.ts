import { describe, expect, it } from 'vitest'
import {
  getDomainNameAndTldFromUrl,
  matchesCredentialHost
} from '@shared/urlUtils'

describe('credential host boundaries', () => {
  it.each([
    ['evil-example.com', 'example.com'],
    ['notexample.com', 'example.com'],
    ['example.com.evil.com', 'example.com'],
    ['evil.co.uk', 'bank.co.uk'],
    ['bob.github.io', 'alice.github.io'],
    ['evil.com', 'co.uk'],
    ['192.168.1.2', '192.168.1.1'],
    ['evil-localhost', 'localhost'],
    ['example.com', '']
  ])('does not offer %s secrets saved for %s', (host, url) => {
    expect(matchesCredentialHost(host, url)).toBe(false)
  })
  it.each([
    ['example.com', 'https://example.com/login'],
    ['accounts.example.com', 'https://mail.example.com'],
    ['login.bank.co.uk', 'https://bank.co.uk'],
    ['alice.github.io', 'https://alice.github.io'],
    ['localhost', 'http://localhost:3000'],
    ['192.168.1.1', 'http://192.168.1.1']
  ])('offers %s secrets saved for %s', (host, url) => {
    expect(matchesCredentialHost(host, url)).toBe(true)
  })
  it('uses the public suffix list', () => {
    expect(getDomainNameAndTldFromUrl('https://bank.co.uk')).toBe('bank.co.uk')
    expect(getDomainNameAndTldFromUrl('https://alice.github.io')).toBe(
      'alice.github.io'
    )
  })
})
