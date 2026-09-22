import browser from 'webextension-polyfill'
import { device } from '@src/background/ExtensionDevice'
import { getTokenSecretFromQrCode } from './AddTOTPSecretButton'
import { TotpEmailMessage } from '@src/util/totpAccountEmail'

const tab = {
  id: 17,
  favIconUrl: 'test.ico',
  url: 'https://www.microsoft.com/',
  incognito: false
}
const qr = (label: string, issuer = 'Microsoft') => ({
  data: `otpauth://totp/${label}?secret=JBSWY3DPEHPK3PXP&issuer=${issuer}`
})

describe('getTokenSecretFromQrCode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(browser.tabs.sendMessage).mockResolvedValue(undefined)
    vi.mocked(browser.runtime.sendMessage).mockResolvedValue(undefined)
  })

  it.each([
    'Microsoft:gael%40frankobusiness.com',
    'Microsoft%3Agael%40frankobusiness.com',
    'gael%40frankobusiness.com'
  ])(
    'keeps the QR account ahead of page and session emails: %s',
    async (label) => {
      const result = await getTokenSecretFromQrCode(qr(label), tab)
      expect(result.totp).toEqual({
        secret: 'JBSWY3DPEHPK3PXP',
        digits: 6,
        period: 30,
        iconUrl: 'test.ico',
        url: 'www.microsoft.com',
        label: 'gael@frankobusiness.com | Microsoft'
      })
      expect(browser.tabs.sendMessage).not.toHaveBeenCalled()
      expect(browser.runtime.sendMessage).not.toHaveBeenCalled()
      expect(device.state?.encrypt).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP')
    }
  )

  it('uses the issuer in the path when the issuer query parameter is absent', async () => {
    const result = await getTokenSecretFromQrCode(
      {
        data: 'otpauth://totp/Microsoft%3Agael%2Bwork%40frankobusiness.com?secret=JBSWY3DPEHPK3PXP'
      },
      tab
    )
    expect(result.totp.label).toBe('gael+work@frankobusiness.com | Microsoft')
  })

  it('does not duplicate an email-only label or lose a literal plus', async () => {
    const result = await getTokenSecretFromQrCode(
      {
        data: 'otpauth://totp/gael+work%40frankobusiness.com?secret=JBSWY3DPEHPK3PXP'
      },
      tab
    )
    expect(result.totp.label).toBe('gael+work@frankobusiness.com')
  })

  it('uses the page email when the QR only names the issuer', async () => {
    vi.mocked(browser.tabs.sendMessage).mockResolvedValue(
      'gael@frankobusiness.com'
    )
    const result = await getTokenSecretFromQrCode(qr('Microsoft'), tab)
    expect(result.totp.label).toBe('gael@frankobusiness.com | Microsoft')
    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(
      17,
      { kind: TotpEmailMessage.PAGE },
      { frameId: 0 }
    )
    expect(browser.runtime.sendMessage).not.toHaveBeenCalled()
  })

  it('uses the last session email when the page has no email', async () => {
    vi.mocked(browser.runtime.sendMessage).mockResolvedValue('last@example.com')
    const result = await getTokenSecretFromQrCode(qr('Microsoft'), tab)
    expect(result.totp.label).toBe('last@example.com | Microsoft')
    expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
      kind: TotpEmailMessage.GET,
      incognito: false
    })
  })

  it('can fall back to the session when the page has no content script', async () => {
    vi.mocked(browser.tabs.sendMessage).mockRejectedValue(
      new Error('No receiver')
    )
    vi.mocked(browser.runtime.sendMessage).mockResolvedValue('last@example.com')
    const result = await getTokenSecretFromQrCode(qr('Microsoft'), tab)
    expect(result.totp.label).toBe('last@example.com | Microsoft')
  })

  it.each([
    ['Bitfinex-8-30-2021', 'Bitfinex', 'Bitfinex'],
    ['Bitfinex-8-30-2021', '', 'Bitfinex-8-30-2021']
  ])(
    'adds a supplied email to provider-only QR codes',
    async (label, issuer, provider) => {
      const result = await getTokenSecretFromQrCode(
        qr(label, issuer),
        tab,
        'trader@example.com'
      )
      expect(result.totp.label).toBe(`trader@example.com | ${provider}`)
    }
  )

  it('does not create a code with no account email', async () => {
    await expect(
      getTokenSecretFromQrCode(qr('Microsoft'), tab)
    ).rejects.toThrow('account email')
    expect(device.state?.encrypt).not.toHaveBeenCalled()
  })

  it('rejects non-TOTP QR codes without logging their contents', async () => {
    await expect(
      getTokenSecretFromQrCode(
        { data: 'https://example.com/?secret=private' },
        tab
      )
    ).rejects.toThrow('TOTP setup')
    await expect(
      getTokenSecretFromQrCode({ data: 'otpauth://totp/Microsoft' }, tab)
    ).rejects.toThrow('does not have any secret')
  })
})
