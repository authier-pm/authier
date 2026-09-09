import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import {
  MAX_PASSWORD_FORM_HTML_BYTES,
  passwordFormHtmlByteLength,
  passwordFormSnapshotSchema
} from '../../../shared/passwordFormClassification'

test.use({ channel: 'chromium' })

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 740 })
  // Open closed shadow roots only in the test, to inspect the production UI.
  await page.addInitScript(() => {
    const attachShadow = Element.prototype.attachShadow
    Element.prototype.attachShadow = function (options) {
      return attachShadow.call(this, { ...options, mode: 'open' })
    }
  })
})

test('offers password generation on the first field and reuses the classification', async ({
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/?scenario=kostkohratky-password')
  const inputs = page.locator('input[type="password"]')
  const trigger = page.getByRole('button', {
    name: 'Open Authier password generator'
  })
  await expect(trigger).toBeVisible()
  const inputBox = await inputs.first().boundingBox()
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox!.y).toBeGreaterThan(inputBox!.y)
  expect(triggerBox!.y + triggerBox!.height).toBeLessThan(
    inputBox!.y + inputBox!.height
  )
  await expect(inputs.first()).toHaveValue('')
  await expect(inputs.last()).toHaveValue('')
  await trigger.click()
  const dialog = page.getByRole('dialog', {
    name: 'Authier password generator',
    exact: true
  })
  await expect(dialog).toBeVisible()
  await page.screenshot({
    path: '../docs/screenshots/kostkohratky-password-generator.png'
  })
  const password = await dialog.locator('code').innerText()
  await dialog.getByRole('button', { name: 'Fill', exact: true }).click()
  await expect(inputs.first()).toHaveValue(password)
  await expect(
    page.getByRole('dialog', { name: 'Save login to Authier' })
  ).toBeVisible()
  await expect(page).toHaveURL(/scenario=kostkohratky-password/)
  await page.reload()
  await expect(trigger).toBeVisible()
  expect(
    await page.evaluate(() =>
      localStorage.getItem('preview-classification-requests')
    )
  ).toBe('1')
  const snapshot = await page.evaluate(() =>
    localStorage.getItem('preview-classification-snapshot')
  )
  // The live provider smoke check uses exactly the sanitized production payload.
  await writeFile(
    'test-results/kostkohratky-classification-snapshot.json',
    snapshot!
  )
  expect(errors).toEqual([])
})

test('trims a large form and still offers the first-field generator', async ({
  page
}) => {
  await page.goto('/?scenario=kostkohratky-password&large-form=1')
  const trigger = page.getByRole('button', {
    name: 'Open Authier password generator'
  })
  await expect(trigger).toBeVisible()
  const snapshot = passwordFormSnapshotSchema.parse(
    JSON.parse(
      (await page.evaluate(() =>
        localStorage.getItem('preview-classification-snapshot')
      ))!
    )
  )
  expect(
    await page.locator('form').evaluate((form) => form.outerHTML.length)
  ).toBeGreaterThan(262_000)
  expect(passwordFormHtmlByteLength(snapshot.html)).toBeLessThanOrEqual(
    MAX_PASSWORD_FORM_HTML_BYTES
  )
  expect(snapshot.html).toContain('data-authier-trimmed')
  expect(snapshot.html).toContain('Nové heslo znovu')
  const inputBox = await page
    .locator('input[type="password"]')
    .first()
    .boundingBox()
  const triggerBox = await trigger.boundingBox()
  expect(triggerBox!.y).toBeGreaterThan(inputBox!.y)
  expect(triggerBox!.y + triggerBox!.height).toBeLessThan(
    inputBox!.y + inputBox!.height
  )
  await trigger.click()
  await expect(
    page.getByRole('dialog', {
      name: 'Authier password generator',
      exact: true
    })
  ).toBeVisible()
  await page.screenshot({
    path: '../docs/screenshots/kostkohratky-large-form-generator.png'
  })
})
