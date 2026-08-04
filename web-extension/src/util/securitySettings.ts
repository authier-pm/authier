import type { SettingsInput } from '@shared/generated/graphqlBaseTypes'
import type { SecuritySettings } from '@src/background/backgroundSchemas'

export const toBackendSettings = (
  settings: SecuritySettings
): SettingsInput => {
  const {
    autofillCredentialsEnabled: _autofillCredentialsEnabled,
    ...backendSettings
  } = settings

  return backendSettings
}
