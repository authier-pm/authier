import { expect, test } from '@playwright/test'
import path from 'node:path'

const screenshot = (name: string) =>
  path.resolve('..', 'docs', 'screenshots', name)

for (const theme of ['dark', 'light']) {
  test(`device policy is centered and saves in ${theme} theme`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?scenario=new-device-policy')
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme
    }, theme)
    const dialog = page.getByRole('dialog', { name: 'New device policy' })
    await expect(dialog).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Save policy' })
    ).toBeDisabled()
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.width).toBeLessThanOrEqual(576)
    expect(Math.abs(bounds!.x + bounds!.width / 2 - 640)).toBeLessThan(2)
    expect(Math.abs(bounds!.y + bounds!.height / 2 - 450)).toBeLessThan(2)
    // Keyboard focus cannot enter the vault behind the native modal.
    expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(
      true
    )
    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      expect(
        await dialog.evaluate(
          (element) =>
            element.contains(document.activeElement) ||
            document.activeElement === document.body
        )
      ).toBe(true)
    }
    const approval = page.getByRole('radio', { name: /Require approval/ })
    const allow = page.getByRole('radio', { name: /Allow any new device/ })
    await allow.check()
    await approval.check()
    await expect(allow).not.toBeChecked()
    await expect(approval).toBeChecked()
    await expect(
      page.getByRole('button', { name: 'Save policy' })
    ).toBeEnabled()
    await page.screenshot({
      animations: 'disabled',
      path: screenshot(`new-device-policy-${theme}.png`)
    })
    await page.getByRole('button', { name: 'Save policy' }).click()
    await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await expect(approval).toBeDisabled()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByTestId('saved-policy')).toHaveText(
      'REQUIRE_ANY_DEVICE_APPROVAL'
    )
    await expect(page.getByRole('button', { name: 'Settings' })).toBeEnabled()
  })
}

test('small viewport scrolls to Save and failed saves can be retried', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 480 })
  await page.goto('/?scenario=new-device-policy&error=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(320)
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
  const bounds = await dialog.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(16)
  expect(bounds!.y).toBeGreaterThanOrEqual(16)
  expect(bounds!.height).toBeLessThanOrEqual(448)
  await page.getByRole('radio', { name: /Allow any new device/ }).check()
  await page.getByRole('button', { name: 'Save policy' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Could not save your policy'
  )
  await expect(
    page.getByRole('radio', { name: /Allow any new device/ })
  ).toBeChecked()
  await page.getByRole('button', { name: 'Save policy' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByTestId('saved-policy')).toHaveText('ALLOW')

  await page.setViewportSize({ width: 390, height: 760 })
  await page.goto('/?scenario=new-device-policy')
  await expect(dialog).toBeVisible()
  await page.getByRole('radio', { name: /Require approval/ }).check()
  await expect(page.getByRole('button', { name: 'Save policy' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save policy' }).focus()
  await page.screenshot({
    animations: 'disabled',
    path: screenshot('new-device-policy-mobile.png')
  })
})

test('accounts with a policy are not prompted again', async ({ page }) => {
  await page.goto('/?scenario=new-device-policy&configured=1')
  await expect(page.getByTestId('saved-policy')).toHaveText('ALLOW')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
