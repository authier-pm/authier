import { expect, test } from '@playwright/test'

test.use({ channel: 'chromium', viewport: { width: 1100, height: 820 } })

test.beforeEach(async ({ page }) => {
  // Inspect the production closed shadow UI only in browser tests.
  await page.addInitScript(() => {
    const attachShadow = Element.prototype.attachShadow
    Element.prototype.attachShadow = function (options) {
      return attachShadow.call(this, { ...options, mode: 'open' })
    }
  })
})

const triggerName = 'Open Authier verification codes'
const dialogName = 'Authier verification codes'
const choiceName = 'Fill verification code from mailer@shopify.com'

test('selects a masked email code and replaces all six React-controlled inputs', async ({
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?scenario=inline-verification-codes')
  const inputs = page.locator('[data-code-inputs] input')
  await expect(inputs).toHaveCount(6)
  const trigger = page.getByRole('button', { name: triggerName })
  const lastBox = await inputs.last().boundingBox()
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox!.x).toBeGreaterThan(lastBox!.x + lastBox!.width)
  await trigger.hover()
  const dialog = page.getByRole('dialog', { name: dialogName })
  await expect(dialog).toBeHidden()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('506***')
  await expect(dialog).not.toContainText('506731')
  await expect(dialog).not.toContainText('unrelated.example')
  await expect(dialog).toContainText('fill all 6 digits')
  await expect(inputs.first()).toHaveValue('')
  await page.screenshot({
    path: '../docs/screenshots/inline-verification-codes.png'
  })
  // Selecting a code must replace a partially entered code in all six boxes.
  await inputs.nth(0).fill('1')
  await inputs.nth(1).fill('2')
  await trigger.click()
  await expect(dialog.getByRole('button', { name: choiceName })).toBeVisible()
  await dialog.getByRole('button', { name: choiceName }).click()
  for (const [index, digit] of [...'506731'].entries())
    await expect(inputs.nth(index)).toHaveValue(digit)
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('status')).toHaveText('Verification code filled')
  await page.screenshot({
    path: '../docs/screenshots/inline-verification-codes-filled.png'
  })
  expect(errors).toEqual([])
})

test('supports keyboard opening, Escape, and outside-click dismissal', async ({
  page
}) => {
  await page.goto('/?scenario=inline-verification-codes')
  const trigger = page.getByRole('button', { name: triggerName })
  const dialog = page.getByRole('dialog', { name: dialogName })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await page.getByRole('heading').click()
  await expect(dialog).toBeHidden()
})

test('tracks late-mounted and replaced forms without duplicating the logo', async ({
  page
}) => {
  await page.goto('/?scenario=inline-verification-codes&late=1')
  const trigger = page.getByRole('button', { name: triggerName })
  await expect(trigger).toHaveCount(0)
  await page.getByRole('button', { name: 'Show verification form' }).click()
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.getByRole('dialog', { name: dialogName })).toBeVisible()
  await page.getByRole('button', { name: 'Hide verification form' }).click()
  await expect(trigger).toHaveCount(0)
  await page.getByRole('button', { name: 'Show verification form' }).click()
  await expect(trigger).toHaveCount(1)
  await trigger.click()
  await page.getByRole('button', { name: choiceName }).click()
  await expect(page.getByRole('status')).toHaveText('Verification code filled')
})

test('fills a single code field and blocks script-generated clicks', async ({
  page
}) => {
  await page.goto('/?scenario=inline-verification-codes&single=1')
  const trigger = page.getByRole('button', { name: triggerName })
  await trigger.evaluate((button: HTMLButtonElement) => button.click())
  await expect(page.getByRole('dialog', { name: dialogName })).toBeHidden()
  await trigger.click()
  const choice = page.getByRole('button', { name: choiceName })
  await expect(choice).toBeVisible()
  await choice.evaluate((button: HTMLButtonElement) => button.click())
  await expect(
    page.getByRole('textbox', { name: 'Verification code', exact: true })
  ).toHaveValue('')
  await choice.click()
  await expect(
    page.getByRole('textbox', { name: 'Verification code', exact: true })
  ).toHaveValue('506731')
})

test('keeps the dropdown within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 })
  await page.goto('/?scenario=inline-verification-codes')
  await page.getByRole('button', { name: triggerName }).click()
  const dialog = page.getByRole('dialog', { name: dialogName })
  await expect(dialog.getByRole('button', { name: choiceName })).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height).toBeLessThanOrEqual(740)
  await page.screenshot({
    path: '../docs/screenshots/inline-verification-codes-mobile.png'
  })
  await dialog.getByRole('button', { name: choiceName }).click()
  await expect(page.getByRole('status')).toHaveText('Verification code filled')
})

test('fills through the real closed shadow root without dismissing internal clicks', async ({
  page
}) => {
  // The inspection shim is scoped to the original page; this page uses a closed root.
  const closedPage = await page.context().newPage()
  await closedPage.goto('/?scenario=inline-verification-codes')
  await expect(
    closedPage.locator('#authier-verification-code-picker')
  ).toBeAttached()
  const hostIsClosed = await closedPage
    .locator('#authier-verification-code-picker')
    .evaluate((host) => host.shadowRoot === null)
  expect(hostIsClosed).toBe(true)
  const inputs = closedPage.locator('[data-code-inputs] input')
  const lastBox = await inputs.last().boundingBox()
  if (!lastBox) throw new Error('Missing verification field bounds')
  const triggerRight = lastBox.x + lastBox.width + 8 + 32
  await closedPage.mouse.click(
    triggerRight - 16,
    lastBox.y + lastBox.height / 2
  )
  // Select the visible card using the production panel's position.
  await closedPage.mouse.click(
    triggerRight - 160,
    lastBox.y + lastBox.height + 120
  )
  for (const [index, digit] of [...'506731'].entries())
    await expect(inputs.nth(index)).toHaveValue(digit)
  await closedPage.close()
})
