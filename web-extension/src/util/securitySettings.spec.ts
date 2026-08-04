import { describe, expect, it } from 'vitest'
import { toBackendSettings } from './securitySettings'

describe('security settings', () => {
  it('omits the extension-only autofill toggle from backend settings', () => {
    expect(
      toBackendSettings({
        autofillCredentialsEnabled: false,
        autofillForbiddenUrlPatterns: 'example.com/private/*',
        autofillTOTPEnabled: true,
        notificationOnVaultUnlock: false,
        notificationOnWrongPasswordAttempts: 3,
        syncTOTP: true,
        uiLanguage: 'en',
        vaultLockTimeoutSeconds: 3600
      })
    ).toEqual({
      autofillForbiddenUrlPatterns: 'example.com/private/*',
      autofillTOTPEnabled: true,
      notificationOnVaultUnlock: false,
      notificationOnWrongPasswordAttempts: 3,
      syncTOTP: true,
      uiLanguage: 'en',
      vaultLockTimeoutSeconds: 3600
    })
  })
})
