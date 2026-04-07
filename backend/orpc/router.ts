import { implement, ORPCError } from '@orpc/server'
import { desc, eq, sql } from 'drizzle-orm'
import { verify } from 'jsonwebtoken'
import {
  DecryptionChallengeApproved,
  DecryptionChallengeMutation
} from '../models/DecryptionChallenge'
import {
  DeviceMutation,
  DeviceQuery,
  getEncryptedSecretsToSync,
  type DeviceInput
} from '../models/Device'
import { UserMutation } from '../models/UserMutation'
import { UserQuery } from '../models/UserQuery'
import type { IContext } from '../models/types/ContextTypes'
import type { jwtPayloadRefreshToken } from '../userAuth'
import { createAuthTokens } from '../userAuth'
import { RootResolver } from '../schemas/RootResolver'
import * as schema from '../drizzle/schema'
import { GraphqlError, GraphqlErrorUnauthorized } from '../lib/GraphqlError'
import { vaultApiContract } from '@shared/orpc/contract'
import type { OrpcContext } from './context'
import { requireAuthContext } from './context'
import { EncryptedSecretTypeGQL } from '../models/types/EncryptedSecretType'
import { UserNewDevicePolicyGQL } from '../models/types/UserNewDevicePolicy'

const os = implement(vaultApiContract).$context<OrpcContext>()

const protectedBase = os.use(async ({ context, next }) => {
  const authCtx = await requireAuthContext(context.legacyCtx)

  return next({
    context: {
      ...context,
      authCtx
    }
  })
})

const asIsoString = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : null

const raiseAsOrpcError = (error: unknown): never => {
  if (error instanceof ORPCError) {
    throw error
  }

  if (error instanceof GraphqlErrorUnauthorized) {
    throw new ORPCError('UNAUTHORIZED', {
      message: error.message
    })
  }

  if (error instanceof GraphqlError) {
    throw new ORPCError('BAD_REQUEST', {
      message: error.message
    })
  }

  throw error
}

const mapSecretRecord = (secret: {
  id: string
  encrypted: string
  kind: 'TOTP' | 'LOGIN_CREDENTIALS'
  version: number
  createdAt: Date | string
  updatedAt: Date | string | null
}) => ({
  id: secret.id,
  encrypted: secret.encrypted,
  kind: secret.kind,
  version: secret.version,
  createdAt: new Date(secret.createdAt).toISOString(),
  updatedAt: asIsoString(secret.updatedAt)
})

const mapSyncSecretRecord = (secret: {
  id: string
  encrypted: string
  kind: 'TOTP' | 'LOGIN_CREDENTIALS'
  version: number
  createdAt: Date | string
  updatedAt: Date | string | null
  deletedAt: Date | string | null
}) => ({
  ...mapSecretRecord(secret),
  deletedAt: asIsoString(secret.deletedAt)
})

const mapCurrentDevice = (device: {
  id: string
  name: string
  platform: string
  syncTOTP: boolean
  vaultLockTimeoutSeconds: number
  createdAt: Date | string
  lastSyncAt: Date | string | null
  logoutAt: Date | string | null
}) => ({
  id: device.id,
  name: device.name,
  platform: device.platform,
  syncTOTP: device.syncTOTP,
  vaultLockTimeoutSeconds: device.vaultLockTimeoutSeconds,
  createdAt: new Date(device.createdAt).toISOString(),
  lastSyncAt: asIsoString(device.lastSyncAt),
  logoutAt: asIsoString(device.logoutAt)
})

const mapSecurityState = (
  user: {
    newDevicePolicy:
      | 'ALLOW'
      | 'REQUIRE_ANY_DEVICE_APPROVAL'
      | 'REQUIRE_MASTER_DEVICE_APPROVAL'
      | null
    deviceRecoveryCooldownMinutes: number
    masterDeviceId: string | null
  },
  device: {
    vaultLockTimeoutSeconds: number
  }
) => ({
  newDevicePolicy: user.newDevicePolicy,
  deviceRecoveryCooldownMinutes: user.deviceRecoveryCooldownMinutes,
  masterDeviceId: user.masterDeviceId,
  vaultLockTimeoutSeconds: device.vaultLockTimeoutSeconds
})

const getPendingChallenges = async (
  ctx: OrpcContext['legacyCtx'],
  userId: string
) => {
  const challenges = await ctx.db.query.decryptionChallenge.findMany({
    where: {
      userId,
      approvedAt: { isNull: true },
      rejectedAt: { isNull: true }
    },
    orderBy: (challenge, helpers) => [helpers.desc(challenge.createdAt)]
  })

  return Promise.all(
    challenges.map(async (challenge) => {
      const [resetRequest] = await ctx.db
        .select({
          requestedAt: schema.masterDeviceResetRequest.createdAt,
          processAt: schema.masterDeviceResetRequest.processAt,
          confirmedAt: schema.masterDeviceResetRequest.confirmedAt,
          rejectedAt: schema.masterDeviceResetRequest.rejectedAt
        })
        .from(schema.masterDeviceResetRequest)
        .where(
          eq(
            schema.masterDeviceResetRequest.decryptionChallengeId,
            challenge.id
          )
        )
        .limit(1)

      return {
        id: challenge.id,
        createdAt: challenge.createdAt.toISOString(),
        deviceName: challenge.deviceName,
        deviceId: challenge.deviceId,
        ipAddress: challenge.ipAddress,
        pushNotificationsSentCount: challenge.pushNotificationsSentCount,
        pushNotificationsFailedCount: challenge.pushNotificationsFailedCount,
        masterDeviceResetRequestedAt: asIsoString(resetRequest?.requestedAt),
        masterDeviceResetProcessAt: asIsoString(resetRequest?.processAt),
        masterDeviceResetConfirmedAt: asIsoString(resetRequest?.confirmedAt),
        masterDeviceResetRejectedAt: asIsoString(resetRequest?.rejectedAt)
      }
    })
  )
}

const getSessionBootstrap = async (
  ctx: OrpcContext['legacyCtx'],
  userId: string,
  deviceId: string
) => {
  const user = await ctx.db.query.user.findFirst({
    where: { id: userId },
    columns: {
      id: true,
      email: true,
      masterDeviceId: true,
      newDevicePolicy: true,
      deviceRecoveryCooldownMinutes: true
    }
  })

  if (!user) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  const currentDevice = await ctx.db.query.device.findFirst({
    where: { id: deviceId }
  })

  if (!currentDevice) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  const secrets = await ctx.db.query.encryptedSecret.findMany({
    where: {
      userId,
      deletedAt: { isNull: true }
    },
    orderBy: (secret, helpers) => [
      helpers.desc(secret.updatedAt),
      helpers.desc(secret.createdAt)
    ]
  })

  const pendingChallenges = await getPendingChallenges(ctx, userId)

  return {
    user: {
      id: user.id,
      email: user.email,
      masterDeviceId: user.masterDeviceId,
      newDevicePolicy: user.newDevicePolicy,
      deviceRecoveryCooldownMinutes: user.deviceRecoveryCooldownMinutes
    },
    currentDevice: mapCurrentDevice(currentDevice),
    secrets: secrets.map(mapSecretRecord),
    pendingChallenges
  }
}

const getAuthenticatedSession = async (
  ctx: OrpcContext['legacyCtx'],
  userId: string,
  deviceId: string
) => {
  const user = await ctx.db.query.user.findFirst({
    where: { id: userId },
    columns: {
      id: true,
      tokenVersion: true
    }
  })

  const device = await ctx.db.query.device.findFirst({
    where: { id: deviceId },
    columns: {
      id: true,
      vaultLockTimeoutSeconds: true
    }
  })

  if (!user || !device) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  return {
    ...createAuthTokens(user, device),
    session: await getSessionBootstrap(ctx, userId, deviceId)
  }
}

const getRefreshSessionActor = async (
  ctx: OrpcContext['legacyCtx'],
  refreshToken: string
) => {
  const payload = getRefreshPayload(refreshToken)

  const user = await ctx.db.query.user.findFirst({
    where: { id: payload.userId },
    columns: {
      id: true,
      tokenVersion: true
    }
  })

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  const device = await ctx.db.query.device.findFirst({
    where: { id: payload.deviceId }
  })

  if (!device || device.logoutAt) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  return {
    device,
    user
  }
}

const getOwnedDevice = async (
  ctx: OrpcContext['legacyCtx'],
  userId: string,
  deviceId: string
) => {
  const device = await ctx.db.query.device.findFirst({
    where: {
      id: deviceId,
      userId
    }
  })

  if (!device) {
    throw new ORPCError('NOT_FOUND', {
      message: 'device not found'
    })
  }

  return device
}

const getOwnedChallenge = async (
  ctx: OrpcContext['legacyCtx'],
  userId: string,
  challengeId: number
) => {
  const challenge = await ctx.db.query.decryptionChallenge.findFirst({
    where: {
      id: challengeId,
      userId
    }
  })

  if (!challenge) {
    throw new ORPCError('NOT_FOUND', {
      message: 'challenge not found'
    })
  }

  return challenge
}

const getSessionUser = async (
  ctx: OrpcContext['legacyCtx'],
  userId: string
) => {
  const user = await ctx.db.query.user.findFirst({
    where: { id: userId },
    columns: {
      id: true,
      email: true,
      masterDeviceId: true,
      newDevicePolicy: true,
      deviceRecoveryCooldownMinutes: true
    }
  })

  if (!user) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'not authenticated'
    })
  }

  return user
}

const getRefreshPayload = (refreshToken: string) => {
  try {
    return verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as jwtPayloadRefreshToken
  } catch {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'invalid refresh token'
    })
  }
}

const toEncryptedSecretType = (kind: 'TOTP' | 'LOGIN_CREDENTIALS') =>
  kind === 'TOTP'
    ? EncryptedSecretTypeGQL.TOTP
    : EncryptedSecretTypeGQL.LOGIN_CREDENTIALS

export const vaultOrpcRouter = os.router({
  auth: {
    register: os.auth.register.handler(async ({ input, context }) => {
      try {
        const rootResolver = new RootResolver()

        await rootResolver.registerNewUser(
          {
            ...input.input,
            email: input.email,
            deviceId: input.deviceId,
            deviceName: input.deviceName
          },
          input.userId,
          context.legacyCtx
        )

        return getAuthenticatedSession(
          context.legacyCtx,
          input.userId,
          input.deviceId
        )
      } catch (error) {
        return raiseAsOrpcError(error)
      }
    }),
    requestDeviceChallenge: os.auth.requestDeviceChallenge.handler(
      async ({ input, context }) => {
        try {
          const rootResolver = new RootResolver()
          const result = await rootResolver.deviceDecryptionChallenge(
            input.email,
            input.deviceInput as DeviceInput,
            context.legacyCtx
          )

          if (result instanceof DecryptionChallengeApproved) {
            return {
              status: 'approved' as const,
              challengeId: result.id,
              userId: result.userId,
              deviceId: result.deviceId,
              deviceName: result.deviceName,
              approvedAt: new Date(
                result.approvedAt ?? result.createdAt
              ).toISOString(),
              addDeviceSecretEncrypted: result.addDeviceSecretEncrypted,
              encryptionSalt: result.encryptionSalt
            }
          }

          return {
            status: 'pending' as const,
            challengeId: result.id,
            pushNotificationsSentCount: result.pushNotificationsSentCount,
            pushNotificationsFailedCount: result.pushNotificationsFailedCount,
            masterDeviceResetRequestedAt: asIsoString(
              result.masterDeviceResetRequestedAt
            ),
            masterDeviceResetProcessAt: asIsoString(
              result.masterDeviceResetProcessAt
            ),
            masterDeviceResetConfirmedAt: asIsoString(
              result.masterDeviceResetConfirmedAt
            ),
            masterDeviceResetRejectedAt: asIsoString(
              result.masterDeviceResetRejectedAt
            )
          }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    completeDeviceLogin: os.auth.completeDeviceLogin.handler(
      async ({ input, context }) => {
        try {
          const challenge =
            await context.legacyCtx.db.query.decryptionChallenge.findFirst({
              where: { id: input.challengeId }
            })

          if (!challenge) {
            throw new ORPCError('NOT_FOUND', {
              message: 'challenge not found'
            })
          }

          const user = await context.legacyCtx.db.query.user.findFirst({
            where: { id: challenge.userId },
            columns: {
              addDeviceSecretEncrypted: true,
              encryptionSalt: true
            }
          })

          if (!user) {
            throw new ORPCError('NOT_FOUND', {
              message: 'user not found'
            })
          }

          const approvedChallenge = Object.assign(
            new DecryptionChallengeApproved(),
            challenge,
            {
              addDeviceSecretEncrypted: user.addDeviceSecretEncrypted,
              encryptionSalt: user.encryptionSalt
            }
          )

          await approvedChallenge.addNewDeviceForUser(
            input.input,
            input.currentAddDeviceSecret,
            context.legacyCtx
          )

          return getAuthenticatedSession(
            context.legacyCtx,
            challenge.userId,
            challenge.deviceId
          )
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    initiateMasterDeviceReset: os.auth.initiateMasterDeviceReset.handler(
      async ({ input, context }) => {
        try {
          const rootResolver = new RootResolver()
          const result = await rootResolver.initiateMasterDeviceReset(
            input.email,
            input.deviceInput as DeviceInput,
            input.decryptionChallengeId,
            context.legacyCtx
          )

          return {
            requestedAt: result.requestedAt.toISOString(),
            processAt: result.processAt.toISOString(),
            alreadyPending: result.alreadyPending
          }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    refreshTokens: os.auth.refreshTokens.handler(async ({ input, context }) => {
      const { user, device } = await getRefreshSessionActor(
        context.legacyCtx,
        input.refreshToken
      )

      return createAuthTokens(user, device)
    }),
    refresh: os.auth.refresh.handler(async ({ input, context }) => {
      const { user, device } = await getRefreshSessionActor(
        context.legacyCtx,
        input.refreshToken
      )
      return getAuthenticatedSession(context.legacyCtx, user.id, device.id)
    }),
    logout: protectedBase.auth.logout.handler(async ({ context }) => {
      try {
        const rootResolver = new RootResolver()
        await rootResolver.logout(context.authCtx, false)

        return { ok: true as const }
      } catch (error) {
        return raiseAsOrpcError(error)
      }
    })
  },
  session: {
    bootstrap: protectedBase.session.bootstrap.handler(async ({ context }) => {
      return getSessionBootstrap(
        context.legacyCtx,
        context.authCtx.jwtPayload.userId,
        context.authCtx.jwtPayload.deviceId
      )
    }),
    markAsSynced: protectedBase.session.markAsSynced.handler(
      async ({ context }) => {
        const [syncedDevice] = await context.legacyCtx.db
          .update(schema.device)
          .set({
            lastSyncAt: sql`CURRENT_TIMESTAMP`
          })
          .where(eq(schema.device.id, context.authCtx.jwtPayload.deviceId))
          .returning({
            lastSyncAt: schema.device.lastSyncAt
          })

        if (!syncedDevice?.lastSyncAt) {
          throw new ORPCError('UNAUTHORIZED', {
            message: 'not authenticated'
          })
        }

        return { lastSyncAt: syncedDevice.lastSyncAt.toISOString() }
      }
    ),
    syncSecrets: protectedBase.session.syncSecrets.handler(
      async ({ context }) => {
        const currentDevice = await context.legacyCtx.db.query.device.findFirst(
          {
            where: { id: context.authCtx.jwtPayload.deviceId }
          }
        )

        if (!currentDevice) {
          throw new ORPCError('UNAUTHORIZED', {
            message: 'not authenticated'
          })
        }

        const secrets = await getEncryptedSecretsToSync(
          {
            ...context.authCtx,
            device: currentDevice
          },
          {
            lastSyncAt: currentDevice.lastSyncAt,
            userId: context.authCtx.jwtPayload.userId
          }
        )

        return {
          secrets: secrets.map(mapSyncSecretRecord)
        }
      }
    )
  },
  vault: {
    listSecrets: protectedBase.vault.listSecrets.handler(
      async ({ context }) => {
        const secrets =
          await context.legacyCtx.db.query.encryptedSecret.findMany({
            where: {
              userId: context.authCtx.jwtPayload.userId,
              deletedAt: { isNull: true }
            },
            orderBy: (secret, helpers) => [
              helpers.desc(secret.updatedAt),
              helpers.desc(secret.createdAt)
            ]
          })

        return {
          secrets: secrets.map(mapSecretRecord)
        }
      }
    ),
    createSecret: protectedBase.vault.createSecret.handler(
      async ({ input, context }) => {
        try {
          const result = await new UserMutation({
            id: context.authCtx.jwtPayload.userId
          } as Record<string, unknown>).addEncryptedSecrets(
            [
              {
                kind: toEncryptedSecretType(input.kind),
                encrypted: input.encrypted
              }
            ],
            context.authCtx
          )

          if (result instanceof GraphqlError) {
            throw result
          }

          const createdSecret = result[0]

          if (!createdSecret) {
            throw new ORPCError('BAD_REQUEST', {
              message: 'secret was not created'
            })
          }

          return mapSecretRecord(createdSecret)
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    updateSecret: protectedBase.vault.updateSecret.handler(
      async ({ input, context }) => {
        try {
          const secret =
            await context.legacyCtx.db.query.encryptedSecret.findFirst({
              where: {
                id: input.id,
                userId: context.authCtx.jwtPayload.userId
              }
            })

          if (!secret) {
            throw new ORPCError('NOT_FOUND', {
              message: 'secret not found'
            })
          }

          const [updated] = await context.legacyCtx.db
            .update(schema.encryptedSecret)
            .set({
              encrypted: input.patch.encrypted,
              kind: input.patch.kind,
              version: secret.version + 1,
              updatedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(schema.encryptedSecret.id, secret.id))
            .returning()

          return mapSecretRecord(updated)
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    deleteSecret: protectedBase.vault.deleteSecret.handler(
      async ({ input, context }) => {
        try {
          const secret =
            await context.legacyCtx.db.query.encryptedSecret.findFirst({
              where: {
                id: input.id,
                userId: context.authCtx.jwtPayload.userId
              }
            })

          if (!secret) {
            throw new ORPCError('NOT_FOUND', {
              message: 'secret not found'
            })
          }

          const [deleted] = await context.legacyCtx.db
            .update(schema.encryptedSecret)
            .set({
              deletedAt: sql`CURRENT_TIMESTAMP`
            })
            .where(eq(schema.encryptedSecret.id, secret.id))
            .returning()

          return {
            id: deleted.id
          }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    )
  },
  devices: {
    list: protectedBase.devices.list.handler(async ({ context }) => {
      const devices = await new UserQuery({
        id: context.authCtx.jwtPayload.userId
      } as Record<string, unknown>).devices(context.authCtx)

      return {
        devices: await Promise.all(
          devices.map(async (device) => ({
            ...mapCurrentDevice(device),
            firstIpAddress: device.firstIpAddress,
            lastIpAddress: device.lastIpAddress,
            lastGeoLocation: await Object.assign(
              new DeviceQuery(),
              device
            ).lastGeoLocation()
          }))
        )
      }
    }),
    listPendingChallenges: protectedBase.devices.listPendingChallenges.handler(
      async ({ context }) => ({
        challenges: await getPendingChallenges(
          context.legacyCtx,
          context.authCtx.jwtPayload.userId
        )
      })
    ),
    approveChallenge: protectedBase.devices.approveChallenge.handler(
      async ({ input, context }) => {
        try {
          const challenge = await getOwnedChallenge(
            context.legacyCtx,
            context.authCtx.jwtPayload.userId,
            input.id
          )

          await Object.assign(
            new DecryptionChallengeMutation(),
            challenge
          ).approve(context.authCtx)

          return { ok: true as const }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    rejectChallenge: protectedBase.devices.rejectChallenge.handler(
      async ({ input, context }) => {
        try {
          const challenge = await getOwnedChallenge(
            context.legacyCtx,
            context.authCtx.jwtPayload.userId,
            input.id
          )

          await Object.assign(
            new DecryptionChallengeMutation(),
            challenge
          ).reject(context.authCtx)

          return { ok: true as const }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    rename: protectedBase.devices.rename.handler(async ({ input, context }) => {
      try {
        const device = await getOwnedDevice(
          context.legacyCtx,
          context.authCtx.jwtPayload.userId,
          input.id
        )

        const updated = await Object.assign(
          new DeviceMutation(),
          device
        ).rename(context.authCtx, input.name)

        return mapCurrentDevice(updated)
      } catch (error) {
        return raiseAsOrpcError(error)
      }
    }),
    logout: protectedBase.devices.logout.handler(async ({ input, context }) => {
      try {
        const device = await getOwnedDevice(
          context.legacyCtx,
          context.authCtx.jwtPayload.userId,
          input.id
        )

        await Object.assign(new DeviceMutation(), device).logout(
          context.authCtx
        )

        return { ok: true as const }
      } catch (error) {
        return raiseAsOrpcError(error)
      }
    }),
    remove: protectedBase.devices.remove.handler(async ({ input, context }) => {
      try {
        const device = await getOwnedDevice(
          context.legacyCtx,
          context.authCtx.jwtPayload.userId,
          input.id
        )

        await Object.assign(new DeviceMutation(), device).removeDevice(
          context.authCtx
        )

        return { ok: true as const }
      } catch (error) {
        return raiseAsOrpcError(error)
      }
    }),
    setMaster: protectedBase.devices.setMaster.handler(
      async ({ input, context }) => {
        try {
          const user = await getSessionUser(
            context.legacyCtx,
            context.authCtx.jwtPayload.userId
          )

          await new UserMutation(user).setMasterDevice(
            context.authCtx,
            input.newMasterDeviceId
          )

          return { ok: true as const }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    )
  },
  security: {
    get: protectedBase.security.get.handler(async ({ context }) => {
      const user = await getSessionUser(
        context.legacyCtx,
        context.authCtx.jwtPayload.userId
      )

      return {
        security: mapSecurityState(user, context.authCtx.device)
      }
    }),
    updateNewDevicePolicy: protectedBase.security.updateNewDevicePolicy.handler(
      async ({ input, context }) => {
        try {
          const user = await getSessionUser(
            context.legacyCtx,
            context.authCtx.jwtPayload.userId
          )

          const updated = await new UserMutation(user).setNewDevicePolicy(
            input.newDevicePolicy as UserNewDevicePolicyGQL,
            context.authCtx
          )

          return {
            security: mapSecurityState(updated, context.authCtx.device)
          }
        } catch (error) {
          return raiseAsOrpcError(error)
        }
      }
    ),
    updateRecoveryCooldown:
      protectedBase.security.updateRecoveryCooldown.handler(
        async ({ input, context }) => {
          try {
            const user = await getSessionUser(
              context.legacyCtx,
              context.authCtx.jwtPayload.userId
            )

            const updated = await new UserMutation(
              user
            ).setDeviceRecoveryCooldownMinutes(
              input.deviceRecoveryCooldownMinutes,
              context.authCtx
            )

            return {
              security: mapSecurityState(updated, context.authCtx.device)
            }
          } catch (error) {
            return raiseAsOrpcError(error)
          }
        }
      ),
    updateVaultLockTimeout:
      protectedBase.security.updateVaultLockTimeout.handler(
        async ({ input, context }) => {
          try {
            const updatedDevice = await Object.assign(
              new DeviceMutation(),
              context.authCtx.device
            ).updateDeviceSettings(
              context.authCtx.device.syncTOTP,
              input.vaultLockTimeoutSeconds,
              context.authCtx
            )

            const user = await getSessionUser(
              context.legacyCtx,
              context.authCtx.jwtPayload.userId
            )

            return {
              security: mapSecurityState(user, updatedDevice)
            }
          } catch (error) {
            return raiseAsOrpcError(error)
          }
        }
      )
  }
})
