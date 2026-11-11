import { expect, test } from '@playwright/test'
import { resolve } from 'node:path'
import {
  newDeviceEmailApprovalPage,
  newDeviceEmailApprovalResult
} from '../../../backend/lib/newDeviceEmailApproval'

const origin = 'https://approval.example.test'
const token = 'a'.repeat(64)

for (const requiresBoth of [false, true]) {
  test(`email confirmation requires a click and keeps the token out of URLs (both=${requiresBoth})`, async ({
    page
  }) => {
    const requests: { method: string; url: string }[] = []
    let approvals = 0
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.route('**/*', async (route) => {
      const request = route.request()
      requests.push({ method: request.method(), url: request.url() })
      const url = new URL(request.url())
      if (url.origin !== origin) return route.abort()
      if (request.method() === 'GET') {
        const response = newDeviceEmailApprovalPage()
        return route.fulfill({
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.text()
        })
      }
      if (url.pathname.endsWith('/review')) {
        expect(request.postDataJSON()).toEqual({ token })
        return route.fulfill({
          json: {
            deviceName: 'Chrome on Linux',
            ipAddress: '192.0.2.10',
            requiresBoth
          }
        })
      }
      expect(new URLSearchParams(request.postData() ?? '').get('token')).toBe(
        token
      )
      approvals++
      const response = newDeviceEmailApprovalResult(
        requiresBoth ? 'waiting-for-device' : 'approved'
      )
      return route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      })
    })
    await page.goto(`${origin}/approve-new-device#token=${token}`)
    const approve = page.getByRole('button', { name: 'Approve this device' })
    await expect(approve).toBeEnabled()
    await expect(page.getByText('Chrome on Linux')).toBeVisible()
    expect(page.url()).toBe(`${origin}/approve-new-device`)
    expect(approvals).toBe(0)
    expect(requests.map((request) => request.method)).toEqual(['GET', 'POST'])
    expect(requests.every((request) => !request.url.includes(token))).toBe(true)
    await expect(page.locator('#approval-instructions')).toContainText(
      'Your master password is still required'
    )
    await expect(page.locator('#approval-instructions')).toContainText(
      requiresBoth
        ? 'another Authier device'
        : 'If this was not you, close this page.'
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
    expect(approvals).toBe(1)
    expect(pageErrors).toEqual([])
  })
}

test('expired links cannot be approved', async ({ page }) => {
  let approvals = 0
  await page.route('**/*', async (route) => {
    if (route.request().method() === 'GET') {
      const response = newDeviceEmailApprovalPage()
      return route.fulfill({
        headers: Object.fromEntries(response.headers),
        body: await response.text()
      })
    }
    if (!route.request().url().endsWith('/review')) approvals++
    return route.fulfill({ status: 400, body: 'Expired approval' })
  })
  await page.goto(`${origin}/approve-new-device#token=${token}`)
  await expect(page.getByRole('status')).toContainText('expired')
  await expect(
    page.getByRole('button', { name: 'Approve this device' })
  ).toBeDisabled()
  expect(approvals).toBe(0)
})
