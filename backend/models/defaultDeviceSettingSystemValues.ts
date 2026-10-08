export const defaultDeviceSettingSystemValues = {
  vaultLockTimeoutSeconds: 28800,
  autofillTOTPEnabled: true,
  passkeyCreationVerificationRequired: true,
  syncTOTP: true
}

export const defaultDeviceSettingUserValuesWithId = {
  ...defaultDeviceSettingSystemValues,
  theme: 'dark',
  id: 0
}
