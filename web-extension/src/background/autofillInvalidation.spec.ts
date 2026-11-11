import browser from 'webextension-polyfill'
import {
  invalidatesAutofill,
  invalidateAutofillInTabs
} from './autofillInvalidation'
import {
  saveLoginModalsStates,
  capturedInputsByDocument
} from './autofillPageState'

const identity = {
  userId: 'user',
  masterEncryptionKey: 'synthetic-key',
  authSecretEncrypted: 'encrypted-verifier'
}

it('invalidates on lock, logout, account change, and key rotation', () => {
  expect(invalidatesAutofill({ oldValue: identity, newValue: null })).toBe(true)
  expect(invalidatesAutofill({ oldValue: identity })).toBe(true)
  expect(
    invalidatesAutofill({
      oldValue: identity,
      newValue: { ...identity, userId: 'another' }
    })
  ).toBe(true)
  expect(
    invalidatesAutofill({
      oldValue: identity,
      newValue: { ...identity, masterEncryptionKey: 'rotated' }
    })
  ).toBe(true)
  expect(
    invalidatesAutofill({
      oldValue: identity,
      newValue: { ...identity, authSecretEncrypted: 'rotated' }
    })
  ).toBe(true)
  expect(
    invalidatesAutofill({
      oldValue: identity,
      newValue: { ...identity, lockTimeEnd: 123 }
    })
  ).toBe(false)
  expect(invalidatesAutofill({ newValue: identity })).toBe(false)
})

it('clears captured plaintext and broadcasts to all frames of every open tab', async () => {
  saveLoginModalsStates.set('7:document', {
    username: 'example',
    password: 'synthetic-password'
  })
  capturedInputsByDocument.set('7:document', [])
  const tab = {
    index: 0,
    active: true,
    highlighted: true,
    pinned: false,
    incognito: false
  }
  vi.mocked(browser.tabs.query).mockResolvedValue([
    { ...tab, id: 7 },
    { ...tab, id: 9 }
  ])
  vi.mocked(browser.tabs.sendMessage).mockResolvedValue(undefined)
  vi.mocked(browser.tabs.sendMessage).mockRejectedValueOnce(
    new Error('Tab closed')
  )
  await invalidateAutofillInTabs()
  expect(saveLoginModalsStates.size).toBe(0)
  expect(capturedInputsByDocument.size).toBe(0)
  expect(browser.tabs.sendMessage).toHaveBeenCalledWith(7, {
    kind: 'authierVaultLocked'
  })
  expect(browser.tabs.sendMessage).toHaveBeenCalledWith(9, {
    kind: 'authierVaultLocked'
  })
})
