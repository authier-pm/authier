import { expect, test } from '@playwright/test'

const showPositions = 'Show password positions'
const hidePositions = 'Hide password positions'
const positionsName = 'Password positions'

test('reveals and hides numbered characters for one saved login in the popup', async ({
  page
}) => {
  await page.setViewportSize({ width: 350, height: 440 })
  await page.goto('/?scenario=password-positions')

  const checkingHeading = page.getByRole('heading', {
    name: 'Example Bank',
    exact: true
  })
  const checking = page.getByRole('listitem').filter({ has: checkingHeading })
  const toggle = checking.getByRole('button', { name: showPositions })
  const positions = page.getByRole('list', { name: positionsName })

  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(positions).toHaveCount(0)

  await toggle.press('Enter')
  await expect(positions).toHaveCount(1)
  await expect(positions.getByRole('listitem')).toHaveText([
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
    checking.getByRole('button', { name: hidePositions })
  ).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: showPositions })).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    350
  )

  await checkingHeading.click()
  await page.mouse.move(0, 0)
  await page.screenshot({
    animations: 'disabled',
    path: '../docs/screenshots/password-positions.png'
  })

  await checking.getByRole('button', { name: hidePositions }).click()
  await expect(positions).toHaveCount(0)
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await checking.getByRole('button', { name: 'Copy password' }).click()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe('V7!sp9#Qct2@x')
})

test('the vault viewer follows edits and closes when the password is masked', async ({
  page
}) => {
  await page.goto('/?scenario=credential-edit')
  await page.getByRole('link', { name: 'Edit credential' }).click()

  const password = page.getByLabel('Password', { exact: true })
  const toggle = page.getByRole('button', { name: showPositions })
  const positions = page.getByRole('list', { name: positionsName })
  await expect(password).toHaveAttribute('type', 'password')
  await expect(toggle).toHaveCount(0)

  await page.getByRole('button', { name: 'Show value' }).click()
  await toggle.click()
  await expect(positions).toBeVisible()

  await password.fill('A 🔑' + 'z'.repeat(48))
  const characters = positions.getByRole('listitem')
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
