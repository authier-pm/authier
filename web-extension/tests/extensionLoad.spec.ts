import { test, expect } from './extensionLoad'

test.describe('Extension load', () => {
  test('Popup is visible', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/js/popup.html#`)
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
  })
  test('Vault is visible', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/js/vault.html#`)
    await expect(page.getByText('Login')).toBeVisible()
  })
})
