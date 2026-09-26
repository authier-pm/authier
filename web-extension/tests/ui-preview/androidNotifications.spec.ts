import { expect, test } from '@playwright/test'

test('renders the captured Android sign-in notification', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1100 })
  await page.goto('/?scenario=android-notifications')
  const capture = page.getByRole('img', {
    name: 'Authier Android sign-in notification'
  })
  await expect(capture).toBeVisible()
  await expect(capture).toHaveJSProperty('naturalWidth', 1080)
  await page.screenshot({
    path: '../docs/screenshots/android-notifications-preview.png',
    fullPage: true
  })
})
