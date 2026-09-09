import { expect, test } from '@playwright/test'
import { androidObtainiumUrl } from '../../../shared/androidDistribution'

test('links the homepage hero, platform list and final call to action to Obtainium', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/?scenario=android-landing')
  const landing = page.frameLocator('iframe')
  for (const selector of ['.hero-actions', '.signal-inner', '.cta-actions']) {
    await expect(
      landing.locator(selector).getByRole('link', { name: /Android/ })
    ).toHaveAttribute('href', androidObtainiumUrl)
  }
  await landing.locator('.hero').screenshot({
    animations: 'disabled',
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/android-landing.png'
  })
  await page.setViewportSize({ width: 390, height: 1200 })
  await expect(
    landing
      .locator('.hero-actions')
      .getByRole('link', { name: 'Android via Obtainium' })
  ).toBeVisible()
  expect(
    await landing.locator('body').evaluate((element) => element.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await landing.locator('.hero-copy').screenshot({
    animations: 'disabled',
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/android-landing-mobile.png'
  })
})

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
  await download.locator('.android-download').screenshot({
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
