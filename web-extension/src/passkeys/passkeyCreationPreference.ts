import { localBooleanPreference } from '@src/util/localBooleanPreference'

export const passkeyCreationVerification = localBooleanPreference(
  'passkeyCreationVerificationRequired',
  true
)
