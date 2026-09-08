import { OpenAPIGenerator } from '@orpc/openapi'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { vaultApiContract } from '@shared/orpc/contract'
import * as schemas from '@shared/orpc/schemas'

const namedSchemas = {
  EmptyInput: schemas.emptyInputSchema,
  DeviceIdentity: schemas.deviceIdentitySchema,
  AddNewDeviceInput: schemas.addNewDeviceInputSchema,
  RegisterInput: schemas.registerInputSchema,
  RequestDeviceChallengeInput: schemas.requestDeviceChallengeInputSchema,
  CompleteDeviceLoginInput: schemas.completeDeviceLoginInputSchema,
  RefreshInput: schemas.refreshInputSchema,
  TokenPair: schemas.tokenPairSchema,
  Device: schemas.currentDeviceSchema,
  SessionUser: schemas.sessionUserSchema,
  Session: schemas.sessionBootstrapSchema,
  AuthenticatedSession: schemas.authenticatedSessionSchema,
  SecretRecord: schemas.encryptedSecretRecordSchema,
  SyncSecretRecord: schemas.mobileSecretRecordSchema,
  VaultChange: schemas.vaultChangeSchema,
  VaultSyncInput: schemas.vaultSyncInputSchema,
  VaultSyncResult: schemas.vaultSyncResultSchema,
  CreateVaultSecretInput: schemas.createVaultSecretInputSchema,
  UpdateVaultSecretInput: schemas.updateVaultSecretInputSchema,
  DeleteVaultSecretInput: schemas.deleteVaultSecretInputSchema,
  ApprovedChallenge: schemas.approvedChallengeSchema,
  PendingChallenge: schemas.pendingChallengeResultSchema,
  DeviceChallenge: schemas.requestDeviceChallengeResultSchema,
  PendingDeviceApproval: schemas.pendingChallengeSchema,
  SecurityState: schemas.securityStateSchema,
  SecurityResponse: schemas.securityResponseSchema,
  OkResult: schemas.okResultSchema
}

export const generateOpenApiDocument = async () => {
  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()]
  })
  const document = await generator.generate(vaultApiContract, {
    info: {
      title: 'Authier API',
      version: '1.0.0',
      description:
        'Encrypted vault API. Clients encrypt and decrypt locally. See backend/orpc/README.md for sync and retry semantics.'
    },
    servers: [{ url: '/api/v1' }],
    filter: ({ contract }) => Boolean(contract['~orpc'].route.path),
    commonSchemas: Object.fromEntries(
      Object.entries(namedSchemas).map(([name, schema]) => [name, { schema }])
    ),
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  })
  const challenge = document.components?.schemas?.DeviceChallenge
  if (challenge && typeof challenge === 'object' && !('$ref' in challenge)) {
    challenge.discriminator = {
      propertyName: 'status',
      mapping: {
        approved: '#/components/schemas/ApprovedChallenge',
        pending: '#/components/schemas/PendingChallenge'
      }
    }
    challenge.oneOf = [
      { $ref: '#/components/schemas/ApprovedChallenge' },
      { $ref: '#/components/schemas/PendingChallenge' }
    ]
    delete challenge.anyOf
  }
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    if (!item?.post) continue
    const publicAuth = path.startsWith('/auth/') && path !== '/auth/logout'
    item.post.security = publicAuth ? [] : [{ bearerAuth: [] }]
  }
  return document
}
