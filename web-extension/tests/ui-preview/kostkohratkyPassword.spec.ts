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

for (const direction of ['below', 'above'] as const) {
  test(`keeps the ${direction} popup open while crossing the trigger gap`, async ({
    page
  }) => {
    const query = direction === 'above' ? '&open-above=1' : ''
    await page.goto(`/?scenario=kostkohratky-password${query}`)
    const trigger = page.getByRole('button', {
      name: 'Open Authier password generator'
    })
    await trigger.hover()
    const dialog = page.getByRole('dialog', {
      name: 'Authier password generator',
      exact: true
    })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveClass(new RegExp(`popover--${direction}`))
    const triggerBox = await trigger.boundingBox()
    const dialogBox = await dialog.boundingBox()
    if (!triggerBox || !dialogBox)
      throw new Error('Missing generator bounds')
    // Take a shallow diagonal straight to the far corner, without first
    // moving vertically through the gap. Check every point along the path.
    const startX = triggerBox.x + triggerBox.width / 2
    const startY = triggerBox.y + triggerBox.height / 2
    for (const cornerY of [dialogBox.y + 2, dialogBox.y + dialogBox.height - 2]) {
      await trigger.hover()
      for (let step = 1; step <= 20; step++) {
        const progress = step / 20
        await page.mouse.move(
          startX + (dialogBox.x + 2 - startX) * progress,
          startY + (cornerY - startY) * progress
        )
        await expect(dialog).toBeVisible()
      }
    }
    await trigger.hover()
    // The expanded bridge must not intercept the trigger's clicks.
    await trigger.click()
    const gapY =
      direction === 'above'
        ? (dialogBox.y + dialogBox.height + triggerBox.y) / 2
        : (triggerBox.y + triggerBox.height + dialogBox.y) / 2
    await page.mouse.move(triggerBox.x + triggerBox.width / 2, gapY, {
      steps: 12
    })
    // Pause inside the gap: even a slow pointer must keep the popup open.
    await page.waitForTimeout(350)
    await expect(dialog).toBeVisible()
    const next = dialog.getByRole('button', { name: 'Next', exact: true })
    await next.hover()
    await expect(dialog).toBeVisible()
    const previousPassword = await dialog.locator('code').innerText()
    await next.click()
    await expect(dialog.locator('code')).not.toHaveText(previousPassword)
    await page.screenshot({
      path: `../docs/screenshots/password-generator-hover-${direction}.png`
    })
    // Crossing back to the trigger works too, and leaving the whole UI closes it.
    await page.mouse.move(triggerBox.x + triggerBox.width / 2, gapY, {
      steps: 12
    })
    await trigger.hover()
    await expect(dialog).toBeVisible()
    await page.mouse.move(10, 10)
    await expect(dialog).toBeHidden()
    await trigger.hover()
    await page.mouse.move(triggerBox.x + triggerBox.width / 2, gapY, {
      steps: 12
    })
    const password = await dialog.locator('code').innerText()
    await dialog.getByRole('button', { name: 'Fill', exact: true }).click()
    await expect(
      page.locator('input[type="password"]').first()
    ).toHaveValue(password)
  })
}

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
