import { chromium, expect, test } from '@playwright/test'

test('remembers unlock after closing and restarting the browser', async ({}, testInfo) => {
  const profile = testInfo.outputPath('browser-profile')
  const firstBrowser = await chromium.launchPersistentContext(profile, {
    headless: true
  })
  const firstPage = await firstBrowser.newPage()
  await firstPage.goto('http://127.0.0.1:4174/?scenario=remembered-session')
  await expect(firstPage.getByText('Example account')).toBeVisible()
  await firstBrowser.close()

  const restartedBrowser = await chromium.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 390, height: 520 }
  })
  const page = await restartedBrowser.newPage()
  await page.goto(
    'http://127.0.0.1:4174/?scenario=remembered-session&requireRemembered=1'
  )
  await expect(page.getByText('user@example.com')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await page.screenshot({
    path: '../docs/screenshots/remembered-session-restart.png'
  })
  await restartedBrowser.close()
})
