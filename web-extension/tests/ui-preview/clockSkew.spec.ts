import { expect, test } from '@playwright/test'

test.use({ channel: 'chromium', viewport: { width: 900, height: 680 } })

test('warns above ten seconds, keeps codes visible, and survives popup reopening', async ({
  page
}) => {
  await page.goto('/?scenario=clock-skew')
  const warning = page.getByRole('alert', { name: 'Check your device clock' })
  await expect(warning).toContainText('45 seconds ahead of the server')
  await expect(warning).toContainText('TOTP codes may be rejected')
  await expect(warning).toContainText('Enable automatic date and time')
  await expect(page.getByRole('list', { name: 'Saved secrets' })).toContainText(
    'alex@example.com | GitHub'
  )
  await page.screenshot({ path: '../docs/screenshots/clock-skew-warning.png' })

  await page.getByRole('button', { name: 'Close popup' }).click()
  await expect(warning).toHaveCount(0)
  await page.getByRole('button', { name: 'Open popup' }).click()
  await expect(warning).toContainText('45 seconds ahead of the server')

  await page.getByRole('button', { name: 'Clock 45 seconds behind' }).click()
  await expect(warning).toContainText('45 seconds behind the server')
  await page
    .getByRole('button', { name: 'Sync after correcting clock' })
    .click()
  await expect(warning).toHaveCount(0)
  await page.getByRole('button', { name: 'Close popup' }).click()
  await page.getByRole('button', { name: 'Open popup' }).click()
  await expect(warning).toHaveCount(0)
})

test('uses a strict ten-second threshold with measurement uncertainty', async ({
  page
}) => {
  const warning = page.getByRole('alert', { name: 'Check your device clock' })
  for (const offset of [10_000, -10_000, 10_500]) {
    await page.goto(`/?scenario=clock-skew&offset=${offset}&uncertainty=500`)
    await expect(
      page.getByRole('list', { name: 'Saved secrets' })
    ).toBeVisible()
    await expect(warning).toHaveCount(0)
  }
  await page.goto('/?scenario=clock-skew&offset=10501&uncertainty=500')
  await expect(warning).toBeVisible()
})

test('does not seed clock skew in unrelated preview scenarios', async ({
  page
}) => {
  await page.goto('/?scenario=passkey-sidebar')
  await expect(page.getByRole('heading', { name: 'Passkeys' })).toBeVisible()
  await expect(
    page.getByRole('alert', { name: 'Check your device clock' })
  ).toHaveCount(0)
})
