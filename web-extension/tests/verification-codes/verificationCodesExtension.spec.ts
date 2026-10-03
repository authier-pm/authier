import { chromium, expect, test, type TestInfo } from '@playwright/test'
import { resolve } from 'node:path'
import { gmailVerificationEmail } from '../../ui-preview/fixtures/gmailVerificationEmail'
import { googleMessagesInbox } from '../../ui-preview/fixtures/googleMessagesConversation'
import { createOfflineVaultSnapshot } from '../../ui-preview/scenarios/offlineVault'
import {
  abToCryptoKey,
  base64ToBuffer,
  encryptString
} from '../../../shared/cryptoUtils'
import {
  VERIFICATION_CODE_STORAGE_KEY,
  VERIFICATION_CODE_EXPIRY_ALARM,
  VERIFICATION_CODE_RELAY_ALARM,
  CodeMessageKind,
  verificationCodesSchema
} from '../../src/verification-codes/verificationCodeProtocol'

const webAppFixtures: Record<string, string> = {
  'mail.google.com': `<!doctype html><title>Gmail test fixture</title>${gmailVerificationEmail}`,
  'messages.google.com': `<!doctype html><title>Google Messages test fixture</title>${googleMessagesInbox}`
}

// Run generateManifest + prodBuild first. Only a disposable profile and synthetic
// messages are used; all network requests are intercepted before opening any tab.
const launchExtension = async (testInfo: TestInfo) => {
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
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.protocol === 'chrome-extension:') return route.continue()
    const fixture = webAppFixtures[url.hostname]
    if (fixture)
      return route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: fixture
      })
    return route.fulfill({
      contentType: 'application/json',
      json: { data: {} }
    })
  })
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  const extensionId = new URL(worker.url()).hostname
  const popup = await context.newPage()
  const readEntries = async () =>
    verificationCodesSchema.parse(
      await popup.evaluate(
        (kind) => chrome.runtime.sendMessage({ kind }),
        CodeMessageKind.LIST
      )
    )
  return { context, worker, extensionId, popup, readEntries }
}

test('built extension detects Gmail in another tab and manages a real toolbar badge', async ({}, testInfo) => {
  const { context, worker, extensionId, popup, readEntries } =
    await launchExtension(testInfo)
  try {
    const mail = await context.newPage()
    await mail.goto('https://mail.google.com/mail/u/0/#inbox')
    await popup.goto(`chrome-extension://${extensionId}/js/popup.html`)
    await expect.poll(async () => (await readEntries()).length).toBe(1)
    expect((await readEntries())[0]).toMatchObject({
      provider: 'Gmail',
      sender: 'someone@example.com',
      code: '213456',
      copied: false
    })
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe(
      '•'
    )
    expect(
      await worker.evaluate(
        (name) => chrome.alarms.get(name),
        VERIFICATION_CODE_EXPIRY_ALARM
      )
    ).toBeTruthy()

    // The production popup uses history.pushState; message authorization must
    // still work after the document URL no longer ends in /js/popup.html.
    await popup.evaluate(() => history.pushState(null, '', '/devices'))
    const [entry] = await readEntries()
    expect(
      await popup.evaluate(
        ({ kind, id }) => chrome.runtime.sendMessage({ kind, id }),
        { kind: CodeMessageKind.OPEN_SOURCE, id: entry.id }
      )
    ).toBe(true)
    expect(
      await worker.evaluate(async () => {
        const tabs = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true
        })
        return tabs[0]?.url
      })
    ).toBe('https://mail.google.com/mail/u/0/#inbox')
    expect((await readEntries())[0].copied).toBe(false)
    await popup.bringToFront()
    await popup.evaluate(
      ({ kind, id }) => chrome.runtime.sendMessage({ kind, id }),
      { kind: CodeMessageKind.COPIED, id: entry.id }
    )
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('')

    // Fresh codes appear without reloading Gmail, while its tab is in the background.
    await mail.locator('.a3s strong').evaluate((element) => {
      element.textContent = 'A7B8C9D0'
    })
    await expect.poll(async () => (await readEntries()).length).toBe(2)
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe(
      '•'
    )
    await mail.reload()
    await expect.poll(async () => (await readEntries()).length).toBe(2)

    // Exercise expiry against actual session storage and browser APIs.
    await worker.evaluate(async (key) => {
      const stored = await chrome.storage.session.get(key)
      const state = stored[key] as { entries: { expiresAt: number }[] }
      for (const item of state.entries) item.expiresAt = Date.now() - 1
      await chrome.storage.session.set({ [key]: state })
    }, VERIFICATION_CODE_STORAGE_KEY)
    expect(await readEntries()).toEqual([])
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('')
    expect(
      await worker.evaluate(
        (name) => chrome.alarms.get(name),
        VERIFICATION_CODE_EXPIRY_ALARM
      )
    ).toBeUndefined()
  } finally {
    await context.close()
  }
})

test('built extension reads unread SMS codes from Google Messages for Web', async ({}, testInfo) => {
  const { context, worker, extensionId, popup, readEntries } =
    await launchExtension(testInfo)
  try {
    const messages = await context.newPage()
    await messages.goto('https://messages.google.com/web/conversations')
    await popup.goto(`chrome-extension://${extensionId}/js/popup.html`)
    await expect.poll(async () => (await readEntries()).length).toBe(2)
    expect(
      (await readEntries()).map(({ provider, sender, code }) => [
        provider,
        sender,
        code
      ])
    ).toEqual([
      ['Google Messages', 'Google', '482913'],
      ['Google Messages', 'AirBank', '474230']
    ])
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe(
      '•'
    )
    // Reloading rerenders the same messages; they must not be added again.
    await messages.reload()
    await expect.poll(async () => (await readEntries()).length).toBe(2)
  } finally {
    await context.close()
  }
})

test('built extension badges an encrypted phone relay while the popup is closed', async ({}, testInfo) => {
  const { context, worker, popup } = await launchExtension(testInfo)
  try {
    // No extension page or web-app content script is active during this test.
    await popup.close()
    const snapshot = await createOfflineVaultSnapshot()
    const key = await abToCryptoKey(
      base64ToBuffer(snapshot.masterEncryptionKey)
    )
    const encrypted = await encryptString(
      key,
      JSON.stringify({
        v: 1,
        code: '482913',
        sender: 'Google',
        receivedAt: Date.now()
      }),
      base64ToBuffer(snapshot.encryptionSalt)
    )
    const token = `e30.${btoa(JSON.stringify({ userId: snapshot.userId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.preview`
    let available = false
    let relayRequests = 0
    await context.route('**/*', (route) => {
      if (new URL(route.request().url()).protocol === 'chrome-extension:')
        return route.continue()
      const operation = route.request().postDataJSON() as {
        operationName?: string
      } | null
      if (operation?.operationName === 'relayedVerificationCodes') {
        relayRequests++
        return route.fulfill({
          json: {
            data: {
              me: {
                id: snapshot.userId,
                relayedVerificationCodes: available
                  ? [
                      {
                        id: 'd24d682b-cbe6-4112-94af-d1542f55716c',
                        encrypted,
                        expiresAt: new Date(Date.now() + 600_000).toISOString(),
                        deviceName: 'Pixel 9'
                      }
                    ]
                  : []
              }
            }
          }
        })
      }
      return route.fulfill({ json: { data: {} } })
    })
    await worker.evaluate(
      async ({ snapshot, token }) => {
        await chrome.storage.session.set({
          backgroundState: snapshot,
          lockedState: null,
          'access-token': token
        })
      },
      { snapshot, token }
    )
    await expect.poll(() => relayRequests).toBeGreaterThan(0)
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('')
    expect(
      await worker.evaluate(
        (name) => chrome.alarms.get(name),
        VERIFICATION_CODE_RELAY_ALARM
      )
    ).toMatchObject({ periodInMinutes: 0.5 })
    available = true
    // Wait for the actual 30-second repeating alarm, without any popup poll.
    await expect
      .poll(() => worker.evaluate(() => chrome.action.getBadgeText({})), {
        timeout: 35_000,
        intervals: [1000]
      })
      .toBe('•')
    const entries = await worker.evaluate(async (key) => {
      const stored = await chrome.storage.session.get(key)
      return stored[key].entries
    }, VERIFICATION_CODE_STORAGE_KEY)
    expect(verificationCodesSchema.parse(entries)).toEqual([
      expect.objectContaining({
        provider: 'Android',
        code: '482913',
        sender: 'Google',
        copied: false
      })
    ])
    expect(
      context
        .pages()
        .every((page) => !page.url().startsWith('chrome-extension:'))
    ).toBe(true)
  } finally {
    await context.close()
  }
})
