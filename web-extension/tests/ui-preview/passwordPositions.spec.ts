import { expect, test } from '@playwright/test'

test('shows numbered characters on the vault credential detail page while revealed', async ({
  page
}) => {
  await page.setViewportSize({ width: 1160, height: 760 })
  await page.goto('/?scenario=credential-edit')
  await page.getByRole('link', { name: 'Edit credential' }).click()

  const password = page.getByLabel('Password', { exact: true })
  const toggle = page.getByRole('button', { name: 'Show password positions' })
  const positions = page.getByRole('list', { name: 'Password positions' })
  await expect(password).toHaveAttribute('type', 'password')
  await expect(toggle).toHaveCount(0)
  await expect(positions).toHaveCount(0)

  await page.getByRole('button', { name: 'Show value' }).click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.press('Enter')
  const characters = positions.getByRole('listitem')
  await expect(characters).toHaveText([
    '1V',
    '27',
    '3!',
    '4s',
    '5p',
    '69',
    '7#',
    '8Q',
    '9c',
    '10t',
    '112',
    '12@',
    '13x'
  ])
  await expect(
    page.getByRole('button', { name: 'Hide password positions' })
  ).toHaveAttribute('aria-expanded', 'true')

  await page.getByRole('heading', { name: 'Example Bank', exact: true }).click()
  await page.mouse.move(0, 0)
  await page.screenshot({
    animations: 'disabled',
    path: '../docs/screenshots/password-positions.png'
  })

  await password.fill('A 🔑' + 'z'.repeat(48))
  await expect(characters).toHaveCount(51)
  await expect(characters.nth(1)).toHaveText('2Space')
  await expect(characters.nth(2)).toHaveText('3🔑')
  await expect(characters.last()).toHaveText('51z')
  await expect(page.getByTestId('saved-credential')).toHaveText('')

  await page.getByRole('button', { name: 'Hide value' }).click()
  await expect(positions).toHaveCount(0)
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Show value' }).click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(positions).toHaveCount(0)
})
