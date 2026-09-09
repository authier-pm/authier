import { expect, test } from '@playwright/test'

test('renders the existing key artwork used by both Android launcher variants', async ({
  page
}) => {
  await page.setViewportSize({ width: 760, height: 360 })
  await page.goto('/?scenario=android-icon')
  for (const name of ['Standard launcher icon', 'Round launcher icon']) {
    const icon = page.getByRole('img', { name })
    await expect(icon).toBeVisible()
    await expect(icon).toHaveJSProperty('naturalWidth', 192)
  }
  await page.screenshot({
    path: '../docs/screenshots/android-icon-preview.png'
  })
})
