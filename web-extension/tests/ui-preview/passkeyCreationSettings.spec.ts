import { expect, test } from '@playwright/test'

test('saves the new-device default independently from the current device', async ({
  page
}) => {
  await page.setViewportSize({ width: 800, height: 1120 })
  await page.goto('/?scenario=passkey-device-defaults')
  const alwaysVerify = page.getByRole('radio', {
    name: /Always verify identity/
  })
  const unlocked = page.getByRole('radio', {
    name: /Allow creating new passkeys/
  })
  const save = page.getByRole('button', { name: 'Save', exact: true })
  await expect(alwaysVerify).toBeChecked()
  await unlocked.check()
  await save.click()
  await expect(save).toBeDisabled()
  await page.reload()
  await expect(unlocked).toBeChecked()
  await page.screenshot({
    path: '../docs/screenshots/passkey-device-defaults.png',
    fullPage: true
  })
  await page.goto('/?scenario=passkey-creation-settings')
  await expect(alwaysVerify).toBeChecked()
  await page.goto('/?scenario=passkey-device-defaults')
  await expect(unlocked).toBeChecked()
  await alwaysVerify.check()
  await save.click()
  await expect(save).toBeDisabled()
  await page.reload()
  await expect(alwaysVerify).toBeChecked()
})

test('fits the new-device defaults on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/?scenario=passkey-device-defaults')
  await page.getByRole('radio', { name: /Allow creating new passkeys/ }).check()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360
  )
})

test('defaults to verifying identity and remembers the device-local choice', async ({
  page
}) => {
  await page.setViewportSize({ width: 680, height: 620 })
  await page.goto('/?scenario=passkey-creation-settings')
  const alwaysVerify = page.getByRole('radio', {
    name: /Always verify identity/
  })
  const unlocked = page.getByRole('radio', {
    name: /Allow creating new passkeys/
  })
  await expect(alwaysVerify).toBeChecked()
  await unlocked.check()
  await expect(page.getByRole('status')).toHaveText('Saved on this device.')
  await page.reload()
  await expect(unlocked).toBeChecked()
  await page.screenshot({
    path: '../docs/screenshots/passkey-creation-settings.png'
  })
  await alwaysVerify.check()
  await expect(page.getByRole('status')).toHaveText('Saved on this device.')
  await page.reload()
  await expect(alwaysVerify).toBeChecked()
})

test('fits the creation choices on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/?scenario=passkey-creation-settings')
  await page.getByRole('radio', { name: /Allow creating new passkeys/ }).check()
  await expect(page.getByRole('status')).toHaveText('Saved on this device.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360
  )
})
