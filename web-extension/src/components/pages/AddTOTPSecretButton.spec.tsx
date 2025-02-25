import { device } from '@src/background/ExtensionDevice'
import { getTokenSecretFromQrCode } from './AddTOTPSecretButton'

describe('getTokenSecretFromQrCode', () => {
  beforeAll(async () => {
    await device.initialize()
  })
  it('should work for bitfinex TOTP secret QR codes with/without issuer', async () => {
    const secretToken = await getTokenSecretFromQrCode(
      {
        data: 'otpauth://totp/Bitfinex-8-30-2021?secret=SuperDUperSecretToken&issuer=Bitfinex'
      } as any,
      {
        favIconUrl: 'test.ico',
        title: 'testTitle',
        url: 'https://www.bitfinex.com/'
      } as any
    )

    expect({
      ...secretToken,
      id: undefined
    }).toMatchInlineSnapshot(`
      {
        "createdAt": "2037-03-03T13:33:33.333Z",
        "encrypted": "encrypted-string",
        "id": undefined,
        "kind": "TOTP",
        "totp": {
          "digits": 6,
          "iconUrl": "test.ico",
          "label": "Bitfinex",
          "period": 30,
          "secret": "SuperDUperSecretToken",
          "url": "www.bitfinex.com",
        },
      }
    `)

    const res = await getTokenSecretFromQrCode(
      {
        data: 'otpauth://totp/Bitfinex-8-30-2021?secret=SuperDUperSecretToken'
      } as any,
      {
        favIconUrl: 'test.ico',
        title: 'testTitle',
        url: 'https://www.bitfinex.com/'
      } as any
    )
    expect({
      ...res,
      id: undefined
    }).toMatchInlineSnapshot(`
      {
        "createdAt": "2037-03-03T13:33:33.333Z",
        "encrypted": "encrypted-string",
        "id": undefined,
        "kind": "TOTP",
        "totp": {
          "digits": 6,
          "iconUrl": "test.ico",
          "label": "Bitfinex-8-30-2021",
          "period": 30,
          "secret": "SuperDUperSecretToken",
          "url": "www.bitfinex.com",
        },
      }
    `)
  })
})
