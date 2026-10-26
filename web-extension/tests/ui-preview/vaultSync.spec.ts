import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 720 } })

test('counts a local deletion once and excludes unchanged accounts from sync totals', async ({
  page
}) => {
  await page.goto('/?scenario=vault-sync')
  await expect(page.getByText('Duke', { exact: true })).toBeVisible()
  await page.getByRole('checkbox').first().check()
  await page
    .getByRole('button', { name: 'delete secret', exact: true })
    .first()
    .click()
  await page.getByRole('button', { name: 'Yes', exact: true }).click()
  await expect(page.getByText('Duke', { exact: true })).toHaveCount(0)
  await expect(page.getByText('GitHub', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Synchronize vault' }).click()
  const notification = page.getByRole('status').last()
  await expect(notification).toContainText('Sync successful')
  await expect(notification).toContainText('Added/updated: 0 · Removed: 1')
  await page.mouse.move(0, 0)
  await page.screenshot({ path: '../docs/screenshots/vault-sync-deletion.png' })

  await page.getByRole('button', { name: 'Synchronize vault' }).click()
  await expect(notification).toContainText('Added/updated: 0 · Removed: 0')
})
