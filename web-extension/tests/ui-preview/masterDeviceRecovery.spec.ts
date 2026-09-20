import { expect, test } from '@playwright/test'
import path from 'node:path'

const screenshot = (name: string) =>
  path.resolve('..', 'docs', 'screenshots', name)
test('recovery setup defaults, limits and multiple notification addresses', async ({
  page
}) => {
  await page.setViewportSize({ width: 900, height: 1040 })
  await page.goto('/?scenario=master-device-recovery')
  await expect(page.getByLabel('1. Approval from other devices')).toHaveValue(
    '1'
  )
  await expect(page.getByLabel('2. Waiting period')).toHaveValue('48')
  await page.getByRole('button', { name: '+ Add email address' }).click()
  await page.getByLabel('Notification email 1').fill('backup@example.com')
  await page.getByRole('button', { name: '+ Add email address' }).click()
  await page.getByLabel('Notification email 2').fill('family@example.com')
  await page.screenshot({
    path: screenshot('master-device-recovery.png'),
    fullPage: true
  })
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByTestId('saved-config')).toHaveText(
    JSON.stringify({
      requiredApprovals: 1,
      waitMinutes: 2880,
      notificationEmails: ['backup@example.com', 'family@example.com']
    })
  )
  await page.getByLabel('1. Approval from other devices').fill('0')
  await expect(
    page.getByText('No device approval required.', { exact: false })
  ).toBeVisible()
  await page.getByLabel('Waiting period unit').selectOption('1')
  await page.getByLabel('2. Waiting period').fill('4')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  expect(
    await page
      .getByLabel('2. Waiting period')
      .evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)
  ).toBe(true)
  await page.getByLabel('2. Waiting period').fill('5')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByTestId('saved-config')).toContainText(
    '"waitMinutes":5'
  )
  await page.getByLabel('1. Approval from other devices').fill('11')
  expect(
    await page
      .getByLabel('1. Approval from other devices')
      .evaluate((input: HTMLInputElement) => input.validity.rangeOverflow)
  ).toBe(true)
  await page.getByLabel('1. Approval from other devices').fill('10')
  await page.getByLabel('2. Waiting period').fill('129601')
  expect(
    await page
      .getByLabel('2. Waiting period')
      .evaluate((input: HTMLInputElement) => input.validity.rangeOverflow)
  ).toBe(true)
  await page.getByLabel('2. Waiting period').fill('129600')
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByTestId('saved-config')).toContainText(
    '"waitMinutes":129600'
  )
})

test('recovery setup fits mobile and progress explains both safeguards', async ({
  page
}) => {
  await page.goto('/?scenario=master-device-recovery')
  await expect(
    page.getByRole('heading', { name: 'Plan for a lost master device' })
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: screenshot('master-device-recovery-mobile.png'),
    fullPage: true
  })
  await page.goto('/?scenario=master-device-reset-progress')
  await expect(page.getByText('1 of 2 other device approvals')).toBeVisible()
  await expect(
    page.getByText('once all approvals are received.', { exact: false })
  ).toBeVisible()
  await page.screenshot({
    path: screenshot('master-device-reset-progress.png'),
    fullPage: true
  })
})
