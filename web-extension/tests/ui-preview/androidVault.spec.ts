import { test, expect } from '@playwright/test'

test('renders captured native Android vault, authenticator and autofill screens', async ({
  page
}) => {
  await page.setViewportSize({ width: 1200, height: 1200 })
  await page.goto('/?scenario=android-vault')
  await expect(
    page.getByRole('heading', { name: 'Your vault, on Android.' })
  ).toBeVisible()
  await expect(page.locator('body')).not.toHaveClass(/extension-popup/)
  for (const name of [
    'Master device',
    'Confirm master transfer',
    'After master transfer',
    'Unlock settings',
    'Automatic fingerprint prompt',
    'Master password fallback',
    'Fingerprint unlock',
    'Server response',
    'Passwords',
    'Authenticator',
    'Scan a setup code',
    'Review scanned account',
    'Autofill',
    'Link a login'
  ]) {
    const screenshot = page.getByRole('img', {
      name: `Authier Android ${name} screen`
    })
    await expect(screenshot).toBeVisible()
    await expect(screenshot).toHaveJSProperty(
      'naturalWidth',
      name === 'Automatic fingerprint prompt' ? 1280 : 1080
    )
  }
  await page.screenshot({
    path: '../docs/screenshots/android-ui-preview.png',
    fullPage: true
  })
})
