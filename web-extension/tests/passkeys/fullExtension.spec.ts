import { chromium, expect, test } from '@playwright/test'
import { createHash, createPublicKey, verify } from 'node:crypto'
import { resolve } from 'node:path'
import {
  cryptoKeyToString,
  generateEncryptionKey,
  initLocalDeviceAuthSecret,
  bufferToBase64
} from '../../../shared/cryptoUtils'

// Requires generateManifest + prodBuild first. All network traffic is intercepted;
// the test never contacts a real Authier backend or database.
for (const scenario of [
  {
    name: 'localhost',
    origin: 'http://localhost:9988',
    rpId: 'localhost',
    prf: false,
    appid: ''
  },
  {
    name: 'Facebook related origin with optional PRF',
    origin: 'https://accountscenter.facebook.com',
    rpId: 'accounts.meta.com',
    prf: true,
    appid: ''
  },
  {
    name: 'Facebook Advanced Protection checkpoint with optional PRF',
    origin: 'https://www.facebook.com',
    rpId: 'accounts.meta.com',
    prf: true,
    appid: '',
    path: '/checkpoint/advanced_protection/?next=https%3A%2F%2Fwww.facebook.com%2F#'
  },
  {
    name: 'Google sign-in with legacy AppID under nonce CSP',
    origin: 'https://accounts.google.com',
    rpId: 'google.com',
    prf: false,
    appid: 'https://www.gstatic.com/securitykey/origins.json'
  }
]) {
  test(`built extension saves and restores a passkey: ${scenario.name}`, async ({}, testInfo) => {
    const context = await chromium.launchPersistentContext(
      testInfo.outputPath('profile'),
      {
        channel: 'chromium',
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
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
      if (
        url.origin === `https://${scenario.rpId}` &&
        url.pathname === '/.well-known/webauthn'
      )
        return route.fulfill({
          contentType: 'application/json',
          json: { origins: [scenario.origin] }
        })
      if (url.origin === scenario.origin)
        return route.fulfill({
          contentType: 'text/html',
          headers: {
            'Content-Security-Policy':
              "default-src 'none'; script-src 'nonce-passkey-test' 'unsafe-inline'"
          },
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
      await site.goto(`${scenario.origin}${scenario.path ?? '/'}`)
      const popupPromise = context.waitForEvent('page', { timeout: 10_000 })
      const registration = site.evaluate(async (scenario) => {
        const credential = (await navigator.credentials.create({
          publicKey: {
            // Meta encodes a JSON challenge, requests optional PRF and offers
            // several algorithms. Keep its request shape covered end to end.
            challenge: new TextEncoder().encode(
              JSON.stringify({ challenge: btoa('registration challenge') })
            ),
            rp: {
              id: scenario.rpId,
              name: scenario.prf ? 'Meta' : 'Test website'
            },
            user: {
              id: new TextEncoder().encode('user-1'),
              name: 'alex@example.com',
              displayName: 'Alex'
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 },
              { type: 'public-key', alg: -8 }
            ],
            excludeCredentials: [],
            attestation: 'none',
            authenticatorSelection: {
              residentKey: 'preferred',
              userVerification: 'required'
            },
            hints: ['client-device'],
            extensions: scenario.prf
              ? {
                  prf: {
                    eval: {
                      first: new TextEncoder().encode(
                        'MetaPasskeyStaticPrfInputV1'
                      )
                    }
                  }
                }
              : {},
            timeout: 600_000
          }
        })) as PublicKeyCredential
        return {
          id: credential.id,
          type: credential.type,
          publicKey: Array.from(
            new Uint8Array(
              (
                credential.response as AuthenticatorAttestationResponse
              ).getPublicKey()!
            )
          ),
          json: credential.toJSON(),
          extensions: credential.getClientExtensionResults(),
          clientData: JSON.parse(
            new TextDecoder().decode(credential.response.clientDataJSON)
          )
        }
      }, scenario)
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
      expect(registered.clientData).toMatchObject({
        type: 'webauthn.create',
        challenge: Buffer.from(
          JSON.stringify({
            challenge: Buffer.from('registration challenge').toString('base64')
          })
        ).toString('base64url'),
        origin: scenario.origin,
        crossOrigin: false
      })
      if (scenario.prf)
        expect(registered.extensions).toEqual({ prf: { enabled: false } })
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
      const assertion = site.evaluate(async (scenario) => {
        const credential = (await navigator.credentials.get({
          publicKey: {
            challenge: new TextEncoder().encode(
              'fresh authentication challenge'
            ),
            rpId: scenario.rpId,
            extensions: scenario.appid ? { appid: scenario.appid } : {},
            userVerification: 'required',
            timeout: 50_000
          }
        })) as PublicKeyCredential
        const response = credential.response as AuthenticatorAssertionResponse
        return {
          id: credential.id,
          json: credential.toJSON(),
          extensions: credential.getClientExtensionResults(),
          authenticatorData: Array.from(
            new Uint8Array(response.authenticatorData)
          ),
          clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
          signature: Array.from(new Uint8Array(response.signature))
        }
      }, scenario)
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
      expect(signed.extensions).toEqual(scenario.appid ? { appid: false } : {})
      const authenticatorData = Buffer.from(signed.authenticatorData)
      const clientDataJSON = Buffer.from(signed.clientDataJSON)
      expect(authenticatorData.subarray(0, 32)).toEqual(
        createHash('sha256').update(scenario.rpId).digest()
      )
      expect(authenticatorData[32]).toBe(0x1d)
      expect(JSON.parse(clientDataJSON.toString())).toMatchObject({
        type: 'webauthn.get',
        origin: scenario.origin,
        challenge: Buffer.from('fresh authentication challenge').toString(
          'base64url'
        )
      })
      expect(
        verify(
          'sha256',
          Buffer.concat([
            authenticatorData,
            createHash('sha256').update(clientDataJSON).digest()
          ]),
          createPublicKey({
            key: Buffer.from(registered.publicKey),
            format: 'der',
            type: 'spki'
          }),
          Buffer.from(signed.signature)
        )
      ).toBe(true)
      expect(stored).toHaveLength(1)
      expect(JSON.stringify(signed.json)).not.toContain('privateKey')
      expect(extensionId).toHaveLength(32)
      expect(errors).toEqual([])
    } finally {
      await context.close()
    }
  })
}
