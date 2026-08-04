import browser from 'webextension-polyfill'

export const AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY =
  'autofillCredentialsEnabled'

export const getAutofillCredentialsEnabled = async (): Promise<boolean> => {
  const storage = await browser.storage.local.get(
    AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY
  )
  const storedValue = storage[AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY]

  return typeof storedValue === 'boolean' ? storedValue : true
}

export const setAutofillCredentialsEnabled = async (
  enabled: boolean
): Promise<void> => {
  await browser.storage.local.set({
    [AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY]: enabled
  })
}
