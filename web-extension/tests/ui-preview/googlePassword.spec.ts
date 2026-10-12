import { expect, test, type Locator, type Page } from '@playwright/test'

const expectMenuWithinViewport = async (page: Page, menu: Locator) => {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Missing preview viewport')
  await expect(menu).toBeVisible()
  await expect
    .poll(async () => {
      const bounds = await menu.boundingBox()
      return (
        bounds !== null &&
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= viewport.width &&
        bounds.y + bounds.height <= viewport.height
      )
    })
    .toBe(true)
}

test.use({ channel: 'chromium', colorScheme: 'light' })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 820 })
})

for (const variant of ['', '&stale-selector=1']) {
  test(`offers all ten accounts on Google's password challenge${variant}`, async ({
    page
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/?scenario=google-password${variant}`)
    const password = page.getByLabel('Enter your password', { exact: true })
    await expect(password).toHaveAttribute(
      'autocomplete',
      'current-password webauthn'
    )
    await expect(password).toHaveAttribute('name', 'Passwd')
    await expect(password).toHaveValue('Preview-only-password-06!')
    const picker = page.locator('.authier-dropdown')
    await expect(picker).toBeVisible()
    const inputBox = await password.boundingBox()
    const pickerBox = await picker.boundingBox()
    if (!inputBox || !pickerBox)
      throw new Error('Missing password picker bounds')
    expect(pickerBox.x).toBeGreaterThanOrEqual(inputBox.x + inputBox.width - 2)
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(1100)
    expect(pickerBox.y).toBeGreaterThanOrEqual(inputBox.y)
    expect(pickerBox.y).toBeLessThan(inputBox.y + inputBox.height)

    await picker.locator('.authier-logo-icon').hover()
    const menu = picker.locator('.authier-dropdown-content')
    await expectMenuWithinViewport(page, menu)
    const choices = picker.locator('.authier-dropdown-content a')
    await expect(choices).toHaveCount(10)
    const lastChoice = choices.filter({ hasText: 'account10@example.com' })
    await lastChoice.scrollIntoViewIfNeeded()
    await expect(lastChoice).toBeInViewport()
    const secondChoice = choices.filter({ hasText: 'account02@example.com' })
    await secondChoice.scrollIntoViewIfNeeded()
    await expect(secondChoice).toBeInViewport()
    await secondChoice.hover()
    if (!variant) {
      await page.screenshot({
        path: '../docs/screenshots/google-password-picker.png'
      })
    }
    await secondChoice.click()
    await expect(password).toHaveValue('Preview-only-password-02!')
    await expect(page.getByRole('status')).toHaveText('Form submissions: 0')
    expect(errors).toEqual([])
  })
}

test('waits for an explicit choice when the selected account is unavailable', async ({
  page
}) => {
  await page.goto('/?scenario=google-password&no-identity=1')
  const password = page.getByLabel('Enter your password', { exact: true })
  const picker = page.locator('.authier-dropdown')
  await expect(picker).toBeVisible()
  await expect(password).toHaveValue('')
  await picker.locator('.authier-logo-icon').hover()
  await expect(picker.locator('.authier-dropdown-content a')).toHaveCount(10)
  await picker
    .locator('.authier-dropdown-content a')
    .filter({ hasText: 'account02@example.com' })
    .click()
  await expect(password).toHaveValue('Preview-only-password-02!')
  await expect(page.getByRole('status')).toHaveText('Form submissions: 0')
})

test('anchors to a password challenge that mounts late and is then replaced', async ({
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?scenario=google-password&late=1')
  const password = page.getByLabel('Enter your password', { exact: true })
  const picker = page.locator('.authier-dropdown')
  await expect(password).toHaveCount(0)
  await expect(password).toHaveValue('Preview-only-password-06!')
  await expect(picker).toBeVisible()
  await password.evaluate((input) =>
    input.setAttribute('data-old-input', 'true')
  )
  await page.getByRole('button', { name: 'Replace password form' }).click()
  await expect(page.locator('[data-old-input]')).toHaveCount(0)
  await expect(password).toHaveValue('Preview-only-password-06!')
  await expect(picker).toBeVisible()
  await picker.locator('.authier-logo-icon').hover()
  await expect(picker.locator('.authier-dropdown-content a')).toHaveCount(10)
  await expect(page.getByRole('status')).toHaveText('Form submissions: 0')
  expect(errors).toEqual([])
})

test('keeps the dropdown inside a resized viewport and opens above a low field', async ({
  page
}) => {
  await page.goto('/?scenario=google-password')
  const picker = page.locator('.authier-dropdown')
  const menu = picker.locator('.authier-dropdown-content')
  const logo = picker.locator('.authier-logo-icon')
  await expect(picker).toBeVisible()
  await logo.hover()
  await expectMenuWithinViewport(page, menu)
  await page.setViewportSize({ width: 390, height: 820 })
  await logo.hover()
  await expectMenuWithinViewport(page, menu)
  const finalChoice = menu
    .locator('a')
    .filter({ hasText: 'account10@example.com' })
  await finalChoice.scrollIntoViewIfNeeded()
  await expect(finalChoice).toBeInViewport()
  await finalChoice.hover()
  await expectMenuWithinViewport(page, menu)

  await page.setViewportSize({ width: 1100, height: 820 })
  await page.addStyleTag({
    content: '.google-password-preview__card { margin-top: 380px; }'
  })
  await expect
    .poll(async () => (await picker.boundingBox())?.y ?? 0)
    .toBeGreaterThan(550)
  await logo.hover()
  await expectMenuWithinViewport(page, menu)
  await expect
    .poll(async () => {
      const pickerBox = await picker.boundingBox()
      const menuBox = await menu.boundingBox()
      return (
        pickerBox !== null &&
        menuBox !== null &&
        menuBox.y + menuBox.height <= pickerBox.y
      )
    })
    .toBe(true)
})
