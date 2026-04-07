import { describe, expect, it } from 'vitest'
import { ORPCError } from '@orpc/client'
import { getUnauthorizedSessionError } from './orpc'

describe('getUnauthorizedSessionError', () => {
  it('returns an ORPCError for direct unauthorized payloads', () => {
    const result = getUnauthorizedSessionError({
      defined: false,
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'not authenticated'
    })

    expect(result).toBeInstanceOf(ORPCError)
    expect(result?.code).toBe('UNAUTHORIZED')
    expect(result?.status).toBe(401)
  })

  it('returns an ORPCError for wrapped unauthorized payloads', () => {
    const result = getUnauthorizedSessionError({
      json: {
        defined: false,
        code: 'UNAUTHORIZED',
        status: 401,
        message: 'not authenticated'
      }
    })

    expect(result).toBeInstanceOf(ORPCError)
    expect(result?.code).toBe('UNAUTHORIZED')
  })

  it('ignores non-auth payloads', () => {
    expect(
      getUnauthorizedSessionError({
        defined: false,
        code: 'BAD_REQUEST',
        status: 400,
        message: 'nope'
      })
    ).toBeNull()
    expect(getUnauthorizedSessionError({ accessToken: 'ok' })).toBeNull()
  })
})
