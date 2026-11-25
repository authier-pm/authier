import { expect, test } from '@playwright/test'

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

for (const viewport of [
  { width: 1000, height: 700 },
  { width: 390, height: 520 }
]) {
  test(`scrolls to the end of signup at ${viewport.width}px`, async ({
    page
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/?scenario=signup')
    await page.getByLabel('Email', { exact: true }).fill('alex@example.com')
    await page.locator('input[name="password"]').fill('preview-password')
    await page
      .getByRole('button', { name: 'Continue to recovery setup' })
      .click()
    const recovery = page.getByRole('heading', {
      name: 'Plan for a lost master device'
    })
    await expect(recovery).toBeInViewport()

    const submit = page.getByRole('button', {
      name: 'Create account',
      exact: true
    })
    await expect(submit).not.toBeInViewport()
    await page.mouse.move(viewport.width / 2, viewport.height / 2)
    await page.mouse.wheel(0, 2000)
    await expect(submit).toBeInViewport({ ratio: 1 })
    await expect(
      page.getByRole('link', { name: 'Already have an account?' })
    ).toBeInViewport()

    if (viewport.width === 1000) {
      await page.screenshot({
        path: '../docs/screenshots/signupRecoveryScroll.png'
      })

      const layout = page.getByRole('main')
      await layout.press('Home')
      await expect(recovery).toBeInViewport()
      await layout.press('End')
      await expect(submit).toBeInViewport({ ratio: 1 })
    }
    await submit.click()
    await expect(
      page.getByRole('heading', { name: 'Your vault' })
    ).toBeVisible()
  })
}
