import {
  chromium,
  expect,
  test as base,
  type BrowserContext,
  type Worker
} from '@playwright/test'
import { resolve } from 'node:path'
import {
  abToCryptoKey,
  base64ToBuffer,
  encryptString
} from '../../../shared/cryptoUtils'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { createOfflineVaultSnapshot } from '../../ui-preview/scenarios/offlineVault'

const trustedOrigin = 'https://mail.example.com'
const foreignOrigin = 'https://unrelated.example.net'
const plainHttpOrigin = 'http://mail.example.com'
const intranetOrigin = 'http://intranet.example.org'
const localOrigin = 'http://localhost:4173'
const savedPassword = 'mail-preview-password'

type Login = {
  label: string
  username: string
  password: string
  url: string
  iconUrl: null
}

const intranetLogin: Login = {
  label: 'Intranet',
  username: 'admin@intranet.example.org',
  password: 'intranet-preview-password',
  url: intranetOrigin,
  iconUrl: null
}

// The save prompt stores the hostname alone.
const localLogin: Login = {
  label: 'Local app',
  username: 'dev@example.com',
  password: 'local-preview-password',
  url: 'localhost',
  iconUrl: null
}
const loginForm = `
  <form action="/login" onsubmit="event.preventDefault()">
    <h1>Sign in</h1>
    <label>Email <input name="username" autocomplete="username"></label>
    <label>Password <input name="password" type="password" autocomplete="current-password"></label>
    <button type="submit">Sign in</button>
  </form>`

const html = (body: string) => `<!doctype html><html><head>
  <title>Security regression fixture</title>
  <style>body { margin: 30px; } input { display: block; width: 220px; height: 30px; }
  iframe { width: 440px; height: 350px; }</style>
  </head><body>${body}</body></html>`

type VaultBrowser = {
  context: BrowserContext
  worker: Worker
  extensionId: string
}

// The built extension runs unchanged in a disposable profile. Every network
// request is intercepted; these tests never contact a real backend or website.
const test = base.extend<{ vaultLogins: Login[]; vaultBrowser: VaultBrowser }>({
  // Logins saved next to the one for https://mail.example.com.
  vaultLogins: [[], { option: true }],
  vaultBrowser: async ({ vaultLogins }, use, testInfo) => {
    const snapshot = await createOfflineVaultSnapshot()
    const key = await abToCryptoKey(
      base64ToBuffer(snapshot.masterEncryptionKey)
    )
    const salt = base64ToBuffer(snapshot.encryptionSalt)
    snapshot.secrets = [
      snapshot.secrets[0],
      ...(await Promise.all(
        vaultLogins.map(async (login, index) => ({
          id: `security-login-${index}`,
          kind: EncryptedSecretType.LOGIN_CREDENTIALS,
          createdAt: snapshot.secrets[0].createdAt,
          version: 1,
          encrypted: await encryptString(key, JSON.stringify(login), salt)
        }))
      ))
    ]
    snapshot.autofillCredentialsEnabled = true
    const context = await chromium.launchPersistentContext(
      testInfo.outputPath('profile'),
      {
        channel: 'chromium',
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        headless: true,
        viewport: { width: 1440, height: 980 },
        args: [
          `--disable-extensions-except=${resolve('dist')}`,
          `--load-extension=${resolve('dist')}`,
          // Keep plain-http pages on http instead of upgrading them to https.
          '--disable-features=HttpsUpgrades'
        ]
      }
    )
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.protocol === 'chrome-extension:') return route.continue()
      if (
        [
          trustedOrigin,
          foreignOrigin,
          plainHttpOrigin,
          intranetOrigin,
          localOrigin
        ].includes(url.origin)
      ) {
        const body =
          url.pathname === '/frames'
            ? `<iframe title="Trusted login" src="${trustedOrigin}/login"></iframe>
               <iframe title="Foreign login" src="${foreignOrigin}/login"></iframe>`
            : loginForm
        return route.fulfill({ contentType: 'text/html', body: html(body) })
      }
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        json: { errors: [{ message: 'Offline security test' }] }
      })
    })
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'))
    const extensionId = new URL(worker.url()).hostname
    await expect
      .poll(() =>
        worker.evaluate(() => chrome.runtime.onConnect.hasListeners())
      )
      .toBe(true)
    await worker.evaluate(async (state) => {
      const payload = btoa(
        JSON.stringify({
          userId: state.userId,
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      )
      await chrome.storage.local.set({ autofillCredentialsEnabled: true })
      await chrome.storage.session.set({
        backgroundState: state,
        lockedState: null,
        'access-token': `e30.${payload}.security-test-only`
      })
    }, snapshot)
    await use({ context, worker, extensionId })
    await context.close()
  }
})

test('autofills a same-origin frame without disclosing credentials to a foreign frame', async ({
  vaultBrowser
}) => {
  const page = await vaultBrowser.context.newPage()
  await page.goto(`${trustedOrigin}/frames`)
  const trusted = page.frameLocator('iframe[title="Trusted login"]')
  const foreign = page.frameLocator('iframe[title="Foreign login"]')

  await expect(trusted.locator('input[type="password"]')).toHaveValue(
    savedPassword
  )
  // The positive control above proves that the extension has initialized and
  // processed the page, rather than passing merely because autofill is absent.
  await expect(foreign.locator('input[type="password"]')).toHaveValue('')
  await expect(foreign.locator('input[name="username"]')).toHaveValue('')
  await expect(foreign.locator('.authier-dropdown-content a')).toHaveCount(0)
})

test('manual lock stops cached autofill until a fresh unlock', async ({
  vaultBrowser
}) => {
  const { context, worker, extensionId } = vaultBrowser
  const page = await context.newPage()
  await page.goto(`${trustedOrigin}/login`)
  await expect(page.locator('input[type="password"]')).toHaveValue(
    savedPassword
  )
  const unlockedSnapshot = await worker.evaluate(
    async () =>
      (await chrome.storage.session.get('backgroundState')).backgroundState
  )
  const picker = page.locator('.authier-dropdown-content a')

  const vault = await context.newPage()
  await vault.goto(`chrome-extension://${extensionId}/js/vault.html#/`, {
    waitUntil: 'domcontentloaded'
  })
  await vault.getByRole('button', { name: 'Lock', exact: true }).click()
  await expect
    .poll(() =>
      worker.evaluate(async () => {
        const state = await chrome.storage.session.get('backgroundState')
        return state.backgroundState === null
      })
    )
    .toBe(true)
  await expect(picker).toHaveCount(0)

  await page.evaluate((markup) => {
    document.body.innerHTML = markup
  }, loginForm)
  // Give both the mutation observer and delayed autofill a chance to run.
  await page.waitForTimeout(1000)
  await expect(page.locator('input[type="password"]')).toHaveValue('')
  await expect(page.locator('input[name="username"]')).toHaveValue('')
  await expect(page.locator('.authier-dropdown-content a')).toHaveCount(0)

  // Model a fresh password unlock; existing tabs must fetch a new session.
  await worker.evaluate(async (snapshot) => {
    await chrome.storage.session.set({
      backgroundState: snapshot,
      lockedState: null
    })
  }, unlockedSnapshot)
  await expect(page.locator('input[type="password"]')).toHaveValue(
    savedPassword
  )
})

test('the extension RPC honors a timeout in seconds and locks existing page scripts', async ({
  vaultBrowser
}) => {
  const { context, worker, extensionId } = vaultBrowser
  const page = await context.newPage()
  await page.goto(`${trustedOrigin}/login`)
  await expect(page.locator('input[type="password"]')).toHaveValue(
    savedPassword
  )
  const vault = await context.newPage()
  await vault.goto(`chrome-extension://${extensionId}/js/vault.html#/`, {
    waitUntil: 'domcontentloaded'
  })
  await vault.getByRole('button', { name: 'Lock', exact: true }).waitFor()
  await vault.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const port = chrome.runtime.connect()
        port.onMessage.addListener((message) => {
          if (message.trpc?.id !== 77) return
          port.disconnect()
          if (message.trpc.error) reject(new Error('Lock timeout RPC rejected'))
          else resolve()
        })
        port.postMessage({
          trpc: {
            id: 77,
            method: 'mutation',
            params: { path: 'setLockInterval', input: { time: 2 } }
          }
        })
      })
  )
  await expect
    .poll(
      () =>
        worker.evaluate(async () => {
          const stored = await chrome.storage.session.get('backgroundState')
          return stored.backgroundState === null
        }),
      { timeout: 10_000 }
    )
    .toBe(true)
  await page.evaluate((markup) => {
    document.body.innerHTML = markup
  }, loginForm)
  await page.waitForTimeout(1000)
  await expect(page.locator('input[type="password"]')).toHaveValue('')
})

test.describe('plain-http pages', () => {
  // An array value has to be wrapped, or Playwright reads it as [value, options].
  test.use({ vaultLogins: [[intranetLogin, localLogin], { scope: 'test' }] })

  test('get no logins, while local development still autofills', async ({
    vaultBrowser
  }) => {
    const page = await vaultBrowser.context.newPage()
    for (const { origin, password } of [
      { origin: trustedOrigin, password: savedPassword },
      { origin: localOrigin, password: localLogin.password }
    ]) {
      await page.goto(`${origin}/login`)
      await expect(page).toHaveURL(`${origin}/login`)
      await expect(page.locator('input[type="password"]')).toHaveValue(password)
    }

    // Anyone on the network can serve these pages, so no saved login goes in,
    // not even one saved with an http:// URL.
    for (const origin of [plainHttpOrigin, intranetOrigin]) {
      await page.goto(`${origin}/login`)
      await expect(page).toHaveURL(`${origin}/login`)
      // The pages above were filled by now; give this one the same chance.
      await page.waitForTimeout(1000)
      await expect(page.locator('input[type="password"]')).toHaveValue('')
      await expect(page.locator('input[name="username"]')).toHaveValue('')
      await expect(page.locator('.authier-dropdown-content a')).toHaveCount(0)
    }
  })
})
