import { expect, test } from '@playwright/test'
import { androidObtainiumUrl } from '../../../shared/androidDistribution'

test('offers the configured Obtainium setup on desktop and mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/?scenario=android-updates')
  const download = page.frameLocator('iframe')
  await expect(
    download.getByRole('heading', { name: 'Your vault, kept up to date.' })
  ).toBeVisible()
  await expect(
    download.getByRole('link', { name: 'Set up with Obtainium' })
  ).toHaveAttribute('href', androidObtainiumUrl)
  await download
    .locator('.android-download')
    .screenshot({
      style: 'astro-dev-toolbar { visibility: hidden; }',
      path: '../docs/screenshots/android-updates.png'
    })
  await page.setViewportSize({ width: 390, height: 1450 })
  await expect(
    download.getByRole('link', { name: 'Set up with Obtainium' })
  ).toBeVisible()
  expect(
    await download.locator('body').evaluate((element) => element.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await download.locator('.android-download').screenshot({
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/android-updates-mobile.png'
  })
})
