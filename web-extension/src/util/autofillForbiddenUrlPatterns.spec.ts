import { describe, expect, it } from 'vitest'
import {
  isAutofillForbiddenForUrl,
  parseAutofillForbiddenUrlPatterns,
  serializeAutofillForbiddenUrlPatterns
} from '@shared/autofillForbiddenUrlPatterns'

describe('autofill forbidden URL patterns', () => {
  it('trims line-separated patterns and removes duplicates', () => {
    expect(
      parseAutofillForbiddenUrlPatterns(`
        www.google.com/my-path/*
        https://accounts.example.com/login/*
        www.google.com/my-path/*
      `)
    ).toEqual([
      'www.google.com/my-path/*',
      'https://accounts.example.com/login/*'
    ])

    expect(
      serializeAutofillForbiddenUrlPatterns(
        'example.com/*\r\nexample.com/*\nfoo.test/private/*'
      )
    ).toBe('example.com/*\nfoo.test/private/*')
  })

  it('matches wildcard patterns against the full URL', () => {
    const forbiddenUrlPatterns = [
      'www.google.com/my-path/*',
      'https://secure.example.com/*/login?next=*'
    ].join('\n')

    expect(
      isAutofillForbiddenForUrl(
        'https://www.google.com/my-path/account',
        forbiddenUrlPatterns
      )
    ).toBe(true)
    expect(
      isAutofillForbiddenForUrl(
        'http://www.google.com/my-path/account',
        forbiddenUrlPatterns
      )
    ).toBe(true)
    expect(
      isAutofillForbiddenForUrl(
        'https://www.google.com/another-path/account',
        forbiddenUrlPatterns
      )
    ).toBe(false)
    expect(
      isAutofillForbiddenForUrl(
        'https://secure.example.com/admin/login?next=/dashboard',
        forbiddenUrlPatterns
      )
    ).toBe(true)
    expect(
      isAutofillForbiddenForUrl(
        'http://secure.example.com/admin/login?next=/dashboard',
        forbiddenUrlPatterns
      )
    ).toBe(false)
  })

  it('treats regex characters as URL literals', () => {
    expect(
      isAutofillForbiddenForUrl(
        'https://example.com/search?query=password',
        'https://example.com/search?query=*'
      )
    ).toBe(true)
    expect(
      isAutofillForbiddenForUrl(
        'https://example.com/searchXquery=password',
        'https://example.com/search?query=*'
      )
    ).toBe(false)
  })
})
