import { expect, test } from '@playwright/test'
import { androidObtainiumUrl } from '../../../shared/androidDistribution'

test('September release article renders both updates and screenshots on desktop and mobile', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.goto('/?scenario=september-release-blog')
  const article = page.frameLocator('iframe')
  await expect(
    article.getByRole('heading', {
      level: 1,
      name: 'Email codes in your popup, easier sign-ins on Android'
    })
  ).toBeVisible()
  for (const tag of ['v1.2.13-extension', 'v0.1.5-android']) {
    await expect(
      article.getByRole('link', { name: tag, exact: true })
    ).toHaveAttribute(
      'href',
      `https://github.com/authier-pm/authier/releases/tag/${tag}`
    )
  }
  const images = article.locator('article img')
  await expect(images).toHaveCount(3)
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      )
      .toBeGreaterThan(0)
  }
  await page.goto('http://127.0.0.1:4321/blog/email-codes-and-easier-sign-ins')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.authier.pm/blog/email-codes-and-easier-sign-ins'
  )
  await page.screenshot({
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/september-release-blog-desktop.png'
  })
  await page.setViewportSize({ width: 390, height: 1100 })
  expect(
    await page.locator('body').evaluate((element) => element.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/september-release-blog-mobile.png'
  })
  await page.goto('http://127.0.0.1:4321/blog')
  await expect(
    page.getByRole('link', {
      name: /Email codes in your popup, easier sign-ins on Android/
    })
  ).toHaveAttribute('href', '/blog/email-codes-and-easier-sign-ins')
})

test('links the homepage hero, platform list and final call to action to Obtainium', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/?scenario=android-landing')
  const landing = page.frameLocator('iframe')
  for (const selector of ['.hero-actions', '.header-actions']) {
    await expect(
      landing
        .locator(selector)
        .getByRole('link', { name: 'Get browser extension' })
    ).toHaveAttribute('href', '/download#browsers')
  }
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
  await expect(download.locator('#browsers .browser-card')).toHaveCount(3)
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

test('renders the Android launch article with working screenshots and download links', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1800 })
  await page.goto('/?scenario=android-blog')
  const article = page.frameLocator('iframe')
  await expect(
    article.getByRole('heading', {
      level: 1,
      name: 'Meet the new Authier for Android'
    })
  ).toBeVisible()
  const screenshots = article.locator('.android-gallery img')
  await expect(screenshots).toHaveCount(3)
  for (const screenshot of await screenshots.all()) {
    await expect(screenshot).toHaveJSProperty('naturalWidth', 1080)
  }
  await expect(
    article.getByRole('link', { name: 'get Authier for Android', exact: true })
  ).toHaveAttribute('href', '/download#android')
  await page.goto('http://127.0.0.1:4321/blog/native-android-app')
  await page.screenshot({
    fullPage: true,
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/android-blog-desktop.png'
  })
  await page.goto('/?scenario=android-blog')
  await page.setViewportSize({ width: 390, height: 1100 })
  expect(
    await article.locator('body').evaluate((element) => element.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await article.locator('.article-header').screenshot({
    style: 'astro-dev-toolbar { visibility: hidden; }',
    path: '../docs/screenshots/android-blog-mobile.png'
  })
})
