import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1600, height: 1700 } })

test('bulk delete tooltip appears above the vault card on hover and focus', async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/?scenario=vault-scrolling&selected')
  const button = page.getByRole('button', { name: 'delete 2 secrets' })
  const tooltip = page.getByText('delete 2 secrets', { exact: true }).first()

  await button.hover()
  await expect(tooltip).toBeVisible()
  const buttonBounds = await button.boundingBox()
  const tooltipBounds = await tooltip.boundingBox()
  expect(buttonBounds).not.toBeNull()
  expect(tooltipBounds).not.toBeNull()
  expect(tooltipBounds!.y + tooltipBounds!.height).toBeLessThan(buttonBounds!.y)
  // Visibility alone misses overflow clipping. Check the actual painted layer.
  await expect
    .poll(() =>
      tooltip.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        const painted = document.elementFromPoint(
          bounds.x + bounds.width / 2,
          bounds.y + bounds.height / 2
        )
        return element.contains(painted)
      })
    )
    .toBe(true)
  if (testInfo.project.name === 'chromium') {
    await page.screenshot({
      path: '../docs/screenshots/vault-delete-tooltip.png'
    })
  }

  await page.mouse.move(0, 0)
  await expect(tooltip).not.toBeVisible()
  await button.focus()
  await expect(tooltip).toBeVisible()
  await expect(button).toHaveAccessibleDescription('delete 2 secrets')
  await page.keyboard.press('Escape')
  await expect(tooltip).not.toBeVisible()
})

for (const view of ['table', 'cards']) {
  test(`${view} fills the viewport after loading and after clearing search`, async ({
    page
  }, testInfo) => {
    await page.route('https://www.gravatar.com/**', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        path: 'ui-preview/fixtures/exampleFavicon.svg'
      })
    )
    await page.goto(`/?scenario=vault-scrolling&view=${view}`)
    await expect(
      page.getByText('No secrets found', { exact: true })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Load saved items' }).click()
    const scrollContainer = page.locator('.extension-scrollbar')
    const assertFilled = async () => {
      await expect(
        page.getByText('Saved account 001', { exact: true })
      ).toBeInViewport()
      // Cover the bottom of a tall viewport, beyond the initial overscan.
      const lastVisibleAccount =
        view === 'table' ? 'Saved account 018' : 'Saved account 016'
      await expect(
        page.getByText(lastVisibleAccount, { exact: true })
      ).toBeInViewport()
    }
    await assertFilled()
    await page.mouse.move(0, 0)
    await page.screenshot({
      path: `../docs/screenshots/vault-scrolling-${view}-${testInfo.project.name}.png`
    })
    await scrollContainer.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await expect(
      page.getByText('Saved account 662', { exact: true })
    ).toBeInViewport()
    const search = page.getByPlaceholder(
      'Search vault by url, username, label or password'
    )
    await search.fill('no matching saved accounts')
    await expect(
      page.getByText('No secrets found', { exact: true })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Clear search' }).click()
    await assertFilled()
    await page.setViewportSize({ width: 1600, height: 2100 })
    await expect(
      page.getByText(
        view === 'table' ? 'Saved account 023' : 'Saved account 025',
        { exact: true }
      )
    ).toBeInViewport()
  })
}
