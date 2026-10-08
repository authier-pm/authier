import { localBooleanPreference } from './localBooleanPreference'

export const AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY =
  'autofillCredentialsEnabled'

const preference = localBooleanPreference(
  AUTOFILL_CREDENTIALS_ENABLED_STORAGE_KEY,
  true
)

export const getAutofillCredentialsEnabled = preference.get
export const setAutofillCredentialsEnabled = preference.set
