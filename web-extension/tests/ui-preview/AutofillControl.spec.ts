import { expect, test } from '@playwright/test'

test('pauses autofill for this page without closing the popover', async ({
  page
}) => {
  await page.goto('/?scenario=autofill-controls')

  const trigger = page.getByRole('button', { name: 'Autofill on' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Autofill controls' })
  const pageSwitch = page.getByRole('switch', {
    name: 'Autofill on this page'
  })
  const allPagesSwitch = page.getByRole('switch', {
    name: 'Autofill on all pages'
  })

  await expect(dialog).toBeVisible()
  await expect(pageSwitch).toBeChecked()

  await pageSwitch.evaluate((switchElement) => {
    switchElement.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true })
    )

    const triggerElement = document.querySelector(
      'button[aria-controls="autofill-control-popover"]'
    )
    if (!triggerElement) {
      throw new Error('Autofill trigger was not found')
    }

    triggerElement.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null })
    )
  })
  await expect(dialog).toBeVisible()

  await pageSwitch.click()

  await expect(dialog).toBeVisible()
  await expect(pageSwitch).not.toBeChecked()
  await expect(allPagesSwitch).toBeChecked()
  const autofillTrigger = page.locator(
    'button[aria-controls="autofill-control-popover"]'
  )
  await expect(autofillTrigger).toHaveAttribute('aria-label', 'Autofill paused')

  await pageSwitch.click()

  await expect(dialog).toBeVisible()
  await expect(pageSwitch).toBeChecked()
  await expect(allPagesSwitch).toBeChecked()
  await expect(autofillTrigger).toHaveAttribute('aria-label', 'Autofill on')
})
