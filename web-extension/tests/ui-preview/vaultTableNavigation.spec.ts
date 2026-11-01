import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1600, height: 1000 } })

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https:\/\/account-\d+\.example\.com\//, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<title>Saved website</title>'
    })
  )
  await page.route('https://www.gravatar.com/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      path: 'ui-preview/fixtures/exampleFavicon.svg'
    })
  )
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (value: string) => {
          localStorage.setItem('copied-secret', value)
        }
      }
    })
  })
  await page.goto('/?scenario=vault-scrolling')
  await page.getByRole('button', { name: 'Load saved items' }).click()
  await expect(page.getByText('662 results', { exact: true })).toBeVisible()
})

test('opens the correct detail from the label, URL, secret and row background', async ({
  page
}) => {
  const row = page
    .getByRole('checkbox', { name: 'Select Saved account 001', exact: true })
    .locator('..')
    .locator('..')

  for (const cellIndex of [1, 2, 3]) {
    const point = await row
      .locator(':scope > div')
      .nth(cellIndex)
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return { x: bounds.x + 4, y: bounds.y + bounds.height / 2 }
      })
    await page.mouse.click(point.x, point.y)
    await expect(
      page.getByRole('heading', { name: 'Saved account 001', exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole('textbox', { name: 'URL', exact: true })
    ).toHaveValue('https://account-1.example.com')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(row).toBeVisible()
  }

  await row.click({ position: { x: 8, y: 38 } })
  await expect(
    page.getByRole('heading', { name: 'Saved account 001', exact: true })
  ).toBeVisible()
})

test('opens the correct detail after filtering the table', async ({ page }) => {
  await page
    .getByPlaceholder('Search vault by url, username, label or password')
    .fill('Saved account 662')
  await expect(page.getByText('1 results', { exact: true })).toBeVisible()
  await page
    .getByRole('link', {
      name: 'View details for Saved account 662',
      exact: true
    })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Saved account 662', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'URL', exact: true })
  ).toHaveValue('https://account-662.example.com')
})

test('opens row details with the keyboard', async ({ page }) => {
  const detail = page.getByRole('link', {
    name: 'View details for Saved account 002',
    exact: true
  })
  await detail.focus()
  await expect(detail).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Saved account 002', exact: true })
  ).toBeVisible()
})

test('opens websites in a separate tab and omits the button when no URL is stored', async ({
  page
}, testInfo) => {
  await expect(
    page.getByRole('link', {
      name: 'Open website for Saved account 003',
      exact: true
    })
  ).toHaveCount(0)

  await page.mouse.move(0, 0)
  if (testInfo.project.name === 'chromium') {
    await page.screenshot({
      path: '../docs/screenshots/vault-table-navigation.png',
      animations: 'disabled'
    })
  }

  for (const account of ['001', '002']) {
    const website = page.getByRole('link', {
      name: `Open website for Saved account ${account}`,
      exact: true
    })
    const url = `https://account-${Number(account)}.example.com`
    await expect(website).toHaveAttribute('href', url)
    await expect(website).toHaveAttribute('rel', 'noopener noreferrer')
    const opened = page.waitForEvent('popup')
    await website.click()
    const popup = await opened
    await expect(popup).toHaveURL(`${url}/`)
    await popup.close()
    await expect(page.getByText('662 results', { exact: true })).toBeVisible()
  }
})

test('keeps selection, reveal, copy, edit and delete independent of row navigation', async ({
  page
}) => {
  const checkbox = page.getByRole('checkbox', {
    name: 'Select Saved account 001',
    exact: true
  })
  const row = checkbox.locator('..').locator('..')
  await checkbox.check()
  await expect(checkbox).toBeChecked()
  await expect(page.getByText('1 selected', { exact: true })).toBeVisible()
  await checkbox.uncheck()

  await expect(
    row.getByRole('button', { name: /show|hide.*secret/i })
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Show all secrets', exact: true })
    .click()
  await expect(row.getByText('preview-password', { exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: 'Hide all secrets', exact: true })
    .click()
  await expect(row.getByText('preview-password', { exact: true })).toHaveCount(
    0
  )

  await row.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('copied-secret')))
    .toBe('preview-password')
  await row.getByRole('button', { name: 'delete secret', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Delete confirmation' })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Close delete confirmation', exact: true })
    .click()
  await expect(page.getByText('662 results', { exact: true })).toBeVisible()

  await row
    .getByRole('link', { name: 'Edit Saved account 001', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Saved account 001', exact: true })
  ).toBeVisible()
})
