import { expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import {
  newDeviceEmailApprovalPage,
  newDeviceEmailApprovalResult
} from '../../../backend/lib/newDeviceEmailApproval'

import {
  emailApprovalOrigin as origin,
  emailApprovalToken as token,
  prepareNewDeviceEmailApprovalScenario
} from '../../ui-preview/scenarios/newDeviceEmailApproval'

const renderers = {
  review: newDeviceEmailApprovalPage,
  result: newDeviceEmailApprovalResult
}

for (const requiresBoth of [false, true]) {
  test(`email confirmation requires a click and keeps the token out of URLs (both=${requiresBoth})`, async ({
    page
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const scenario = await prepareNewDeviceEmailApprovalScenario(
      page,
      renderers,
      { requiresBoth }
    )
    const { requests, decisions } = scenario
    await page.goto(scenario.url)
    const approve = page.getByRole('button', { name: 'Approve this device' })
    await expect(approve).toBeEnabled()
    await expect(
      page.getByRole('button', { name: 'Reject this device' })
    ).toBeEnabled()
    await expect(page.getByText('Chrome on Linux')).toBeVisible()
    expect(page.url()).toBe(`${origin}/approve-new-device`)
    expect(decisions).toEqual([])
    expect(requests.map((request) => request.method)).toEqual(['GET', 'POST'])
    expect(requests.every((request) => !request.url.includes(token))).toBe(true)
    await expect(page.locator('#approval-instructions')).toContainText(
      'Your master password is still required'
    )
    await expect(page.locator('#approval-instructions')).toContainText(
      requiresBoth
        ? 'another Authier device'
        : 'Your master password is still required'
    )
    await page.screenshot({
      path: resolve(
        '../docs/screenshots',
        `new-device-email-approval${requiresBoth ? '-both' : ''}.png`
      ),
      fullPage: true
    })
    await approve.click()
    await expect(
      page.getByRole('heading', {
        name: requiresBoth ? 'Email approval confirmed' : 'Device approved'
      })
    ).toBeVisible()
    expect(decisions).toEqual(['approve'])
    expect(pageErrors).toEqual([])
  })
}

test('expired links cannot be approved', async ({ page }) => {
  const scenario = await prepareNewDeviceEmailApprovalScenario(
    page,
    renderers,
    { expired: true }
  )
  const { decisions } = scenario
  await page.goto(scenario.url)
  await expect(page.getByRole('status')).toContainText('expired')
  await expect(
    page.getByRole('button', { name: 'Approve this device' })
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Reject this device' })
  ).toBeDisabled()
  expect(decisions).toEqual([])
  expect(scenario.requests.map((request) => request.method)).toEqual([
    'GET',
    'POST'
  ])
})

for (const rejectIntent of [false, true]) {
  test(`email rejection needs an explicit click (rejection link=${rejectIntent})`, async ({
    page
  }) => {
    const scenario = await prepareNewDeviceEmailApprovalScenario(
      page,
      renderers,
      {
        requiresBoth: true,
        rejectIntent,
        unrecognizedDevice: true
      }
    )
    const { requests, decisions } = scenario
    await page.goto(scenario.url)
    const reject = page.getByRole('button', { name: 'Reject this device' })
    await expect(reject).toBeEnabled()
    await expect(
      page.getByRole('heading', {
        name: rejectIntent
          ? 'Reject this new device?'
          : 'Approve this new device?'
      })
    ).toBeVisible()
    expect(decisions).toEqual([])
    expect(requests.map((request) => request.method)).toEqual(['GET', 'POST'])
    expect(page.url()).toBe(`${origin}/approve-new-device`)
    await page.screenshot({
      path: resolve(
        '../docs/screenshots',
        `new-device-email-rejection${rejectIntent ? '-link' : ''}.png`
      ),
      fullPage: true
    })
    await reject.click()
    await expect(
      page.getByRole('heading', { name: 'Device rejected' })
    ).toBeVisible()
    expect(decisions).toEqual(['reject'])
    expect(requests.every((request) => !request.url.includes(token))).toBe(true)
  })
}
