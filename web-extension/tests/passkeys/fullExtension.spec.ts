import { chromium, expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import {
  cryptoKeyToString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret,
  bufferToBase64
} from '../../../shared/cryptoUtils'

// Requires generateManifest + prodBuild first. All network traffic is intercepted;
// the test never contacts a real Authier backend or database.
test('built extension saves an encrypted passkey and signs in with it after restoring a vault', async ({}, testInfo) => {
  const context = await chromium.launchPersistentContext(
    testInfo.outputPath('profile'),
    {
      channel: 'chromium',
      headless: true,
      args: [
        `--disable-extensions-except=${resolve('dist')}`,
        `--load-extension=${resolve('dist')}`
      ]
    }
  )
  const errors: string[] = []
  context.on('weberror', (error) => errors.push(error.error().message))
  type StoredSecret = {
    id: string
    kind: string
    encrypted: string
    version: number
    createdAt: string
    updatedAt: null
  }
  const stored: StoredSecret[] = []
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.protocol === 'chrome-extension:') return route.continue()
    if (url.hostname === 'localhost')
      return route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Passkey test</title><h1>Passkey test website</h1>'
      })
    const payload = route.request().postDataJSON() as {
      operationName?: string
      variables?: { secrets?: { kind: string; encrypted: string }[] }
    } | null
    if (payload?.operationName === 'addEncryptedSecrets') {
      for (const secret of payload.variables?.secrets ?? [])
        stored.push({
          ...secret,
          id: crypto.randomUUID(),
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: null
        })
      return route.fulfill({
        contentType: 'application/json',
        json: {
          data: {
            me: { __typename: 'UserMutation', addEncryptedSecrets: stored }
          }
        }
      })
    }
    return route.fulfill({
      contentType: 'application/json',
      json: { data: {} }
    })
  })
  try {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'))
    const extensionId = new URL(worker.url()).hostname
    const password = 'test-master-password-only'
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await generateEncryptionKey(password, salt)
    const auth = await initLocalDeviceAuthSecret(key, salt)
    const snapshot = {
      email: 'alex@example.com',
      userId: 'test-user',
      deviceName: 'Test browser',
      secrets: [],
      encryptionSalt: bufferToBase64(salt),
      authSecretEncrypted: auth.addDeviceSecretEncrypted,
      authSecret: auth.addDeviceSecret,
      masterEncryptionKey: await cryptoKeyToString(key),
      vaultLockTimeoutSeconds: 3600,
      syncTOTP: false,
      autofillCredentialsEnabled: false,
      autofillTOTPEnabled: false,
      autofillForbiddenUrlPatterns: '',
      uiLanguage: 'en',
      theme: 'dark',
      notificationOnVaultUnlock: false,
      notificationOnWrongPasswordAttempts: 0
    }
    // Wait until the built worker is listening, then seed only this disposable profile.
    await worker.evaluate(async (state) => {
      const tokenPayload = btoa(
        JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + 3600,
          userId: 'test-user'
        })
      )
      await chrome.storage.session.set({
        backgroundState: state,
        'access-token': `e30.${tokenPayload}.test-only`
      })
    }, snapshot)
    const site = await context.newPage()
    await site.goto('http://localhost:9988/')
    const popupPromise = context.waitForEvent('page', { timeout: 10_000 })
    const registration = site.evaluate(async () => {
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: new TextEncoder().encode('registration challenge'),
          rp: { id: 'localhost', name: 'Test website' },
          user: {
            id: new TextEncoder().encode('user-1'),
            name: 'alex@example.com',
            displayName: 'Alex'
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: {
            residentKey: 'required',
            userVerification: 'required'
          },
          timeout: 50_000
        }
      })) as PublicKeyCredential
      return {
        id: credential.id,
        type: credential.type,
        json: credential.toJSON()
      }
    })
    void registration.catch(() => undefined)
    const popup = await popupPromise
    await popup.waitForURL('**/js/passkey.html?*')
    await popup.getByLabel('Master password').fill(password)
    await popup.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(
      popup.getByText('alex@example.com', { exact: true })
    ).toBeVisible()
    await popup
      .getByRole('button', { name: 'Save passkey', exact: true })
      .click()
    const registered = await registration
    expect(registered.type).toBe('public-key')
    expect(stored).toHaveLength(1)
    expect(stored[0].kind).toBe('PASSKEY')
    expect(stored[0].encrypted).not.toContain('privateKey')
    expect(JSON.stringify(registered.json)).not.toContain('privateKey')

    // Simulate syncing the ciphertext to a fresh vault session, not a new enrollment.
    await worker.evaluate(
      async (state) => {
        const tokenPayload = btoa(
          JSON.stringify({
            exp: Math.floor(Date.now() / 1000) + 3600,
            userId: 'test-user'
          })
        )
        await chrome.storage.session.set({
          backgroundState: state,
          'access-token': `e30.${tokenPayload}.test-only`
        })
      },
      { ...snapshot, secrets: stored }
    )
    await site.bringToFront()
    const assertionPopupPromise = context.waitForEvent('page', {
      timeout: 10_000
    })
    const assertion = site.evaluate(async () => {
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge: new TextEncoder().encode('fresh authentication challenge'),
          rpId: 'localhost',
          userVerification: 'required',
          timeout: 50_000
        }
      })) as PublicKeyCredential
      return { id: credential.id, json: credential.toJSON() }
    })
    void assertion.catch(() => undefined)
    const assertionPopup = await assertionPopupPromise
    await assertionPopup.waitForURL('**/js/passkey.html?*')
    await assertionPopup.getByLabel('Master password').fill(password)
    await assertionPopup
      .getByRole('button', { name: 'Continue', exact: true })
      .click()
    await assertionPopup
      .getByRole('button', { name: 'Sign in', exact: true })
      .click()
    const signed = await assertion
    expect(signed.id).toBe(registered.id)
    expect(stored).toHaveLength(1)
    expect(JSON.stringify(signed.json)).not.toContain('privateKey')
    expect(extensionId).toHaveLength(32)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
