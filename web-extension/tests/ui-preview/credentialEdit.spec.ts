import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1600, height: 1100 } })

test.beforeEach(async ({ page }) => {
  await page.route('https://www.gravatar.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      path: 'ui-preview/fixtures/exampleFavicon.svg'
    })
  )
  await page.goto('/?scenario=credential-edit')
  await page.getByRole('link', { name: 'Edit credential', exact: true }).click()
  await page
    .getByRole('button', { name: 'Show generator', exact: true })
    .click()
})

test('saves existing credential edits while the generator length is invalid', async ({
  page
}) => {
  await page
    .getByRole('textbox', { name: 'Label', exact: true })
    .fill('Work account')
  await page.locator('input[name="password"]').fill('manually-entered-password')
  await page
    .getByRole('spinbutton', { name: 'Length', exact: true })
    .fill('129')
  await expect(
    page.getByRole('button', { name: 'Generate password', exact: true })
  ).toBeDisabled()
  await expect(
    page.getByText('Choose a length between 5 and 128.')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByTestId('saved-credential')).toContainText(
    '"label":"Work account"'
  )
  await expect(page.getByTestId('saved-credential')).toContainText(
    '"password":"manually-entered-password"'
  )
  await page.mouse.move(0, 0)
  await page.screenshot({
    path: '../docs/screenshots/credential-edit-generator-validation.png'
  })
})

test('still validates required credential fields independently of the generator', async ({
  page
}) => {
  await page
    .getByRole('textbox', { name: 'Label', exact: true })
    .fill('Work account')
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill('')
  await page
    .getByRole('spinbutton', { name: 'Length', exact: true })
    .fill('12.5')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Required', { exact: true })).toBeVisible()
  await expect(page.getByTestId('saved-credential')).toHaveText('')
  await page.locator('input[name="username"]').fill('alex@example.com')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByTestId('saved-credential')).toContainText(
    '"label":"Work account"'
  )
})
