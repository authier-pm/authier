import * as schema from './schema'
import { relations } from './relations'

export const dbSchema = {
  ...schema,
  deviceRelations: relations.device,
  userRelations: relations.user,
  defaultSettingsRelations: relations.defaultSettings,
  emailVerificationRelations: relations.emailVerification,
  encryptedSecretRelations: relations.encryptedSecret,
  masterDeviceChangeRelations: relations.masterDeviceChange,
  secretUsageEventRelations: relations.secretUsageEvent,
  webInputRelations: relations.webInput,
  tagRelations: relations.tag,
  tokenRelations: relations.token,
  decryptionChallengeRelations: relations.decryptionChallenge,
  userPaidProductsRelations: relations.userPaidProducts
}
