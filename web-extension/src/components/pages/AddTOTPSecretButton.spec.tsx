import { getTokenSecretFromQrCode } from './AddTOTPSecretButton'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('getTokenSecretFromQrCode', () => {
  it('should work for bitfinex TOTP secret QR codes with/without issuer', () => {
    const secretToken = getTokenSecretFromQrCode(
      {
        data: 'otpauth://totp/Bitfinex-8-30-2021?secret=SuperDUperSecretToken&issuer=Bitfinex'
      } as any,
      {
        favIconUrl: 'test.ico',
        title: 'testTitle',
        url: 'https://www.bitfinex.com/'
      } as any
    )

    expect(secretToken).toMatchInlineSnapshot(`
      Object {
        "icon": "test.ico",
        "label": "Bitfinex",
        "originalUrl": "https://www.bitfinex.com/",
        "secret": "SuperDUperSecretToken",
      }
    `)

    expect(
      getTokenSecretFromQrCode(
        {
          data: 'otpauth://totp/Bitfinex-8-30-2021?secret=SuperDUperSecretToken'
        } as any,
        {
          favIconUrl: 'test.ico',
          title: 'testTitle',
          url: 'https://www.bitfinex.com/'
        } as any
      )
    ).toMatchInlineSnapshot(`
      Object {
        "icon": "test.ico",
        "label": "Bitfinex-8-30-2021",
        "originalUrl": "https://www.bitfinex.com/",
        "secret": "SuperDUperSecretToken",
      }
    `)
  })
})
