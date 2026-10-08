import { expect, test } from '@playwright/test'

test.use({ channel: 'chromium' })

test('edits an encrypted passkey label and displays it in the list', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?scenario=passkey-vault')
  await expect(page.getByText('2 results')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /show|hide.*secret/i })
  ).toHaveCount(0)
  await page.screenshot({
    path: '../docs/screenshots/passkey-vault-list.png'
  })
  await page
    .getByRole('link', { name: 'Edit alex@example.com | GitHub' })
    .click()
  await expect(page.getByText('github.com', { exact: true })).toBeVisible()
  await expect(
    page.getByText('alex@example.com', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'delete secret' })
  ).toBeVisible()
  await expect(page.locator('input')).toHaveCount(1)
  const label = page.getByRole('textbox', { name: 'Label', exact: true })
  const save = page.getByRole('button', { name: 'Save label' })
  await expect(label).toHaveValue('alex@example.com | GitHub')
  await expect(save).toBeDisabled()
  await label.fill('   ')
  await expect(save).toBeDisabled()
  await label.fill('alex@example.com | GitHub — Work')
  await save.click()
  await expect(page.getByRole('status')).toHaveText('Label saved')
  await expect(save).toBeDisabled()
  await page.screenshot({ path: '../docs/screenshots/passkey-vault.png' })
  await page.getByRole('link', { name: 'Back to passkeys' }).click()
  await expect(
    page.getByText('alex@example.com | GitHub — Work', { exact: true })
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'Edit alex@example.com | GitHub — Work' })
    .click()
  await expect(label).toHaveValue('alex@example.com | GitHub — Work')
})

test('keeps the saved label when sync fails and allows retry', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?scenario=passkey-vault&failSave=1')
  await page
    .getByRole('link', { name: 'Edit alex@example.com | GitHub' })
    .click()
  const label = page.getByRole('textbox', { name: 'Label', exact: true })
  await label.fill('Work account')
  await page.getByRole('button', { name: 'Save label' }).click()
  await expect(page.getByRole('alert')).toHaveText(
    'Could not sync passkey. Please try again.'
  )
  await expect(label).toHaveValue('Work account')
  await expect(page.getByRole('button', { name: 'Save label' })).toBeEnabled()
  await page.getByRole('link', { name: 'Back to passkeys' }).click()
  await expect(
    page.getByText('alex@example.com | GitHub', { exact: true })
  ).toBeVisible()
  await expect(page.getByText('Work account', { exact: true })).toHaveCount(0)
})
