import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  authorizePasskeyOrigin,
  getPasskeyOrigin,
  validateRpId
} from './relyingParty'

const origin = 'https://accountscenter.facebook.com'
const rpId = 'accounts.meta.com'
const fetchDocument = vi.fn<typeof fetch>()
const respond = (origins: string[]) =>
  fetchDocument.mockResolvedValue(Response.json({ origins }))

beforeEach(() => {
  fetchDocument.mockReset()
  vi.stubGlobal('fetch', fetchDocument)
})
afterEach(() => vi.unstubAllGlobals())

describe('related passkey origins', () => {
  it('authorizes Meta’s declared Facebook origin without changing the signed origin', async () => {
    respond(['https://messenger.com', 'https://www.facebook.com', origin])
    const authorization = await authorizePasskeyOrigin(rpId, origin)
    expect(getPasskeyOrigin(authorization)).toBe(origin)
    expect(validateRpId(rpId, authorization)).toBe(rpId)
    expect(fetchDocument).toHaveBeenCalledExactlyOnceWith(
      'https://accounts.meta.com/.well-known/webauthn',
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        signal: expect.any(AbortSignal)
      })
    )
    expect(() => validateRpId('unrelated.com', authorization)).toThrow(
      'does not authorize'
    )
    expect(() => validateRpId(rpId, origin)).toThrow('does not authorize')
  })

  it('does not fetch for ordinary same-domain and localhost requests', async () => {
    expect(
      await authorizePasskeyOrigin('example.com', 'https://login.example.com')
    ).toBe('https://login.example.com')
    expect(
      await authorizePasskeyOrigin(undefined, 'http://localhost:3000')
    ).toBe('http://localhost:3000')
    expect(fetchDocument).not.toHaveBeenCalled()
  })

  it.each([
    'com',
    'co.uk',
    'github.io',
    '127.0.0.1',
    '[::1]',
    'localhost',
    'meta.com:443',
    'meta.com/path',
    'meta.com@evil.com',
    'meta.com?query=1'
  ])('rejects invalid RP ID %s before any fetch', async (invalid) => {
    await expect(authorizePasskeyOrigin(invalid, origin)).rejects.toMatchObject(
      { name: 'SecurityError' }
    )
    expect(fetchDocument).not.toHaveBeenCalled()
  })

  it.each([
    ['https://facebook.com'],
    ['https://accountscenter.facebook.com.evil.com'],
    ['https://accountscenter.facebook.com:444'],
    ['http://accountscenter.facebook.com'],
    ['https://*.facebook.com'],
    ['not a URL']
  ])('requires an exact authorized origin: %j', async (candidate) => {
    respond([candidate])
    await expect(authorizePasskeyOrigin(rpId, origin)).rejects.toMatchObject({
      name: 'SecurityError'
    })
  })

  it('counts five registrable labels, including private suffixes, but allows repeated labels', async () => {
    const entries = [
      'https://one.com',
      'https://one.co.uk',
      'https://two.github.io',
      'https://three.com',
      'https://four.com',
      origin,
      'https://six.com'
    ]
    respond(entries)
    expect(validateRpId(rpId, await authorizePasskeyOrigin(rpId, origin))).toBe(
      rpId
    )
    respond(entries)
    await expect(
      authorizePasskeyOrigin(rpId, 'https://six.com')
    ).rejects.toMatchObject({ name: 'SecurityError' })
    respond([
      'https://one.github.io',
      'https://two.github.io',
      'https://three.github.io',
      'https://four.github.io',
      'https://five.github.io',
      origin
    ])
    await expect(authorizePasskeyOrigin(rpId, origin)).rejects.toMatchObject({
      name: 'SecurityError'
    })
  })

  it.each([
    () =>
      new Response('{}', {
        status: 404,
        headers: { 'content-type': 'application/json' }
      }),
    () =>
      new Response(JSON.stringify({ origins: [origin] }), {
        headers: { 'content-type': 'text/html' }
      }),
    () =>
      new Response('invalid JSON', {
        headers: { 'content-type': 'application/json' }
      }),
    () => Response.json({ origins: origin }),
    () => Response.json({ origins: [origin, 1] }),
    () => Response.json({ origins: [origin], padding: 'x'.repeat(65_536) })
  ])(
    'fails closed for malformed, oversized or unsuccessful responses',
    async (response) => {
      fetchDocument.mockResolvedValue(response())
      await expect(authorizePasskeyOrigin(rpId, origin)).rejects.toMatchObject({
        name: 'SecurityError'
      })
    }
  )

  it('fails closed on network errors and redirects', async () => {
    fetchDocument.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(authorizePasskeyOrigin(rpId, origin)).rejects.toMatchObject({
      name: 'SecurityError'
    })
  })
})
