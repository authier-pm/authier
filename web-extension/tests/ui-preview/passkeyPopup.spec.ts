import { expect, test } from '@playwright/test'

test('lists site passkeys below TOTP codes and passwords', async ({ page }) => {
  await page.setViewportSize({ width: 350, height: 520 })
  await page.goto('/?scenario=passkey-popup')
  const items = page.getByRole('listitem')
  await expect(items).toHaveCount(4)
  await expect(items.nth(0)).toContainText('GitHub 2FA')
  await expect(items.nth(1)).toContainText('GitHub password')
  await expect(items.nth(2)).toContainText('Passkey')
  await expect(items.nth(2)).toContainText('alex@example.com')
  await expect(items.nth(3)).toContainText('alex@work.example')
  await expect(page.getByText('Example Cloud', { exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    350
  )
  await page.screenshot({
    path: '../docs/screenshots/passkey-popup.png',
    fullPage: true
  })

  await page.getByRole('switch', { name: 'Site', exact: true }).click()
  await expect(items).toHaveCount(5)
  await expect(items.nth(4)).toContainText('Example Cloud')
  await page.getByPlaceholder('Search').fill('work.example')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('GitHub work')
  await page.getByPlaceholder('Search').fill('example.net')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('Example Cloud')
  await page.getByPlaceholder('Search').fill('')
  await expect(items).toHaveCount(4)
})

test('shows a passkey-only vault instead of the no-secrets message', async ({
  page
}) => {
  await page.goto(
    '/?scenario=passkey-popup&passkeysOnly=1&site=https://login.github.com'
  )
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(
    page.getByText('There are no stored secrets for current domain.')
  ).toHaveCount(0)
  await expect(page.getByText('Start by adding', { exact: false })).toHaveCount(
    0
  )
  await page.goto(
    '/?scenario=passkey-popup&passkeysOnly=1&site=https://unrelated.example.org'
  )
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(
    page.getByText('There are no stored secrets for current domain.')
  ).toBeVisible()
  await page.getByRole('switch', { name: 'Site', exact: true }).click()
  await expect(page.getByRole('listitem')).toHaveCount(3)
})
