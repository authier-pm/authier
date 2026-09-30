import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1600, height: 1700 } })

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
