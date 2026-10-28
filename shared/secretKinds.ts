import { EncryptedSecretType } from './generated/graphqlBaseTypes'

// Read boundaries accept future kinds; only these payloads can be interpreted
// by this client. Never use an `else => TOTP/login` fallback for wire records.
export const isSupportedSecretKind = (
  kind: string
): kind is EncryptedSecretType =>
  kind === EncryptedSecretType.LOGIN_CREDENTIALS ||
  kind === EncryptedSecretType.TOTP ||
  kind === EncryptedSecretType.PASSKEY
