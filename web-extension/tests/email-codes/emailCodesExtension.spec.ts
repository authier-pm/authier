import { chromium, expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import { gmailVerificationEmail } from '../../ui-preview/fixtures/gmailVerificationEmail'
import {
  EMAIL_CODE_STORAGE_KEY,
  EMAIL_CODE_EXPIRY_ALARM,
  EmailCodeMessageKind,
  emailVerificationCodesSchema
} from '../../src/email-codes/emailCodeProtocol'

// Run generateManifest + prodBuild first. Only a disposable profile and synthetic
// mail are used; all network requests are intercepted before opening any tab.
test('built extension detects Gmail in another tab and manages a real toolbar badge', async ({}, testInfo) => {
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
    if (url.hostname === 'mail.google.com')
      return route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html><title>Gmail test fixture</title>${gmailVerificationEmail}`
      })
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
    const mail = await context.newPage()
    await mail.goto('https://mail.google.com/mail/u/0/#inbox')
    const popup = await context.newPage()
    await popup.goto(`chrome-extension://${extensionId}/js/popup.html`)
    const readEntries = async () =>
      emailVerificationCodesSchema.parse(
        await popup.evaluate(
          (kind) => chrome.runtime.sendMessage({ kind }),
          EmailCodeMessageKind.LIST
        )
      )
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
        EMAIL_CODE_EXPIRY_ALARM
      )
    ).toBeTruthy()

    // The production popup uses history.pushState; message authorization must
    // still work after the document URL no longer ends in /js/popup.html.
    await popup.evaluate(() => history.pushState(null, '', '/devices'))
    const [entry] = await readEntries()
    expect(
      await popup.evaluate(
        ({ kind, id }) => chrome.runtime.sendMessage({ kind, id }),
        { kind: EmailCodeMessageKind.OPEN_SOURCE, id: entry.id }
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
      { kind: EmailCodeMessageKind.COPIED, id: entry.id }
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
    }, EMAIL_CODE_STORAGE_KEY)
    expect(await readEntries()).toEqual([])
    expect(await worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('')
    expect(
      await worker.evaluate(
        (name) => chrome.alarms.get(name),
        EMAIL_CODE_EXPIRY_ALARM
      )
    ).toBeUndefined()
  } finally {
    await context.close()
  }
})
