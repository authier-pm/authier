import { expect, test } from '@playwright/test'
import path from 'node:path'

const screenshot = (name: string) =>
  path.resolve('..', 'docs', 'screenshots', name)

for (const theme of ['dark', 'light']) {
  test(`approval choices are centered and save both requirements in ${theme} theme`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.goto('/?scenario=new-device-policy')
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme
    }, theme)
    const dialog = page.getByRole('dialog', { name: 'New device approval' })
    const save = page.getByRole('button', { name: 'Save approval methods' })
    await expect(dialog).toBeVisible()
    await expect(save).toBeDisabled()
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
    const device = page.getByRole('checkbox', {
      name: 'Another Authier device',
      exact: true
    })
    const email = page.getByRole('checkbox', { name: 'Email', exact: true })
    await email.check()
    await device.check()
    await expect(email).toBeChecked()
    await expect(device).toBeChecked()
    await page.getByRole('radio', { name: /Require both approvals/ }).check()
    await expect(save).toBeEnabled()
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.width).toBeLessThanOrEqual(576)
    expect(Math.abs(bounds!.x + bounds!.width / 2 - 640)).toBeLessThan(2)
    expect(Math.abs(bounds!.y + bounds!.height / 2 - 500)).toBeLessThan(2)
    await page.screenshot({
      animations: 'disabled',
      path: screenshot(`new-device-policy-${theme}.png`)
    })
    await save.click()
    await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await expect(device).toBeDisabled()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByTestId('saved-policy')).toHaveText(
      'EMAIL_AND_OTHER_DEVICE'
    )
    await expect(
      page.getByRole('button', { name: 'Settings', exact: true })
    ).toBeEnabled()
  })
}

for (const policy of [
  'EMAIL',
  'OTHER_DEVICE',
  'EMAIL_OR_OTHER_DEVICE'
] as const) {
  test(`saves ${policy} only after choosing a method`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 })
    await page.goto('/?scenario=new-device-policy')
    const email = page.getByRole('checkbox', { name: 'Email', exact: true })
    const device = page.getByRole('checkbox', {
      name: 'Another Authier device',
      exact: true
    })
    if (policy !== 'OTHER_DEVICE') await email.check()
    if (policy !== 'EMAIL') await device.check()
    if (policy === 'EMAIL_OR_OTHER_DEVICE') {
      await page
        .getByRole('radio', { name: /Either approval is enough/ })
        .check()
      await device.uncheck()
      await email.uncheck()
      await expect(
        page.getByRole('button', { name: 'Save approval methods' })
      ).toBeDisabled()
      await email.check()
      await device.check()
    }
    await page.getByRole('button', { name: 'Save approval methods' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByTestId('saved-policy')).toHaveText(policy)
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
  await page.getByRole('checkbox', { name: 'Email', exact: true }).check()
  await page.getByRole('button', { name: 'Save approval methods' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Could not save your policy'
  )
  await expect(
    page.getByRole('checkbox', { name: 'Email', exact: true })
  ).toBeChecked()
  await page.getByRole('button', { name: 'Save approval methods' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByTestId('saved-policy')).toHaveText('EMAIL')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?scenario=new-device-policy')
  await expect(dialog).toBeVisible()
  await page
    .getByRole('checkbox', { name: 'Another Authier device', exact: true })
    .check()
  await expect(
    page.getByRole('button', { name: 'Save approval methods' })
  ).toBeEnabled()
  await page.screenshot({
    animations: 'disabled',
    path: screenshot('new-device-policy-mobile.png')
  })
})

test('configured accounts can change approval methods in Security settings', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/?scenario=new-device-policy&configured=1&settings=1')
  await expect(page.getByTestId('saved-policy')).toHaveText('EMAIL')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page
    .getByRole('checkbox', { name: 'Another Authier device', exact: true })
    .check()
  await page.getByRole('checkbox', { name: 'Email', exact: true }).uncheck()
  await page.getByRole('button', { name: 'Save approval methods' }).click()
  await expect(page.getByTestId('saved-policy')).toHaveText('OTHER_DEVICE')
})

test('master-only approval replaces email and other-device methods and can be changed back', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto('/?scenario=new-device-policy&configured=1&settings=1')
  const master = page.getByRole('checkbox', {
    name: 'Master device only',
    exact: true
  })
  const email = page.getByRole('checkbox', { name: 'Email', exact: true })
  const other = page.getByRole('checkbox', {
    name: 'Another Authier device',
    exact: true
  })
  await other.check()
  await page.getByRole('radio', { name: /Require both approvals/ }).check()
  await master.check()
  await expect(email).not.toBeChecked()
  await expect(other).not.toBeChecked()
  await expect(page.getByRole('radio')).toHaveCount(0)
  await page.getByRole('button', { name: 'Save approval methods' }).click()
  await expect(page.getByTestId('saved-policy')).toHaveText('MASTER_DEVICE')
  await page
    .locator('section')
    .filter({
      has: page.getByRole('heading', {
        name: 'New device approval',
        exact: true
      })
    })
    .screenshot({
      animations: 'disabled',
      path: screenshot('new-device-policy-master.png')
    })
  await email.check()
  await expect(master).not.toBeChecked()
  await page.getByRole('button', { name: 'Save approval methods' }).click()
  await expect(page.getByTestId('saved-policy')).toHaveText('EMAIL')
})

test('master-only onboarding and waiting screen identify the required device', async ({
  page
}) => {
  await page.goto('/?scenario=new-device-policy')
  await page
    .getByRole('checkbox', { name: 'Master device only', exact: true })
    .check()
  await page.getByRole('button', { name: 'Save approval methods' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByTestId('saved-policy')).toHaveText('MASTER_DEVICE')
  await page.goto('/?scenario=new-device-policy&pending=1&master=1')
  await expect(
    page.getByText('Approve from your master device', { exact: true })
  ).toBeVisible()
  await expect(
    page.getByText(/Only that device receives the approval notification/)
  ).toBeVisible()
  await expect(page.getByText('Check your email', { exact: true })).toHaveCount(
    0
  )
})

test('both-required waiting state shows the outstanding approval', async ({
  page
}) => {
  await page.setViewportSize({ width: 750, height: 700 })
  await page.goto('/?scenario=new-device-policy&pending=1&emailApproved=1')
  await expect(page.getByText('Email approved', { exact: true })).toBeVisible()
  await expect(
    page.getByText('Approve from another Authier device', { exact: true })
  ).toBeVisible()
  await expect(page.getByText(/needs both email approval/)).toBeVisible()
  await page.screenshot({
    animations: 'disabled',
    path: screenshot('new-device-approval-pending.png')
  })
})

test('configured approval settings are read-only on another device', async ({
  page
}) => {
  await page.goto(
    '/?scenario=new-device-policy&configured=1&settings=1&nonmaster=1'
  )
  await expect(
    page.getByText('Open your master device to change approval settings.')
  ).toBeVisible()
  await expect(
    page.getByRole('checkbox', { name: 'Email', exact: true })
  ).toBeDisabled()
  await expect(
    page.getByRole('checkbox', { name: 'Another Authier device', exact: true })
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Save approval methods' })
  ).toBeDisabled()
  await expect(page.getByTestId('saved-policy')).toHaveText('EMAIL')
})
