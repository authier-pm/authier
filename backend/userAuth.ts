import type { InferSelectModel } from 'drizzle-orm'
import type { user, device } from './drizzle/schema'
type User = InferSelectModel<typeof user>
type Device = InferSelectModel<typeof device>
import type { JwtPayload } from 'jsonwebtoken'
import { sign } from 'jsonwebtoken'

import { isProd } from './envUtils'
import type { IContext } from './models/types/ContextTypes'
import { GraphqlError } from './lib/GraphqlError'

// Upper bound matching shared/orpc/schemas.ts MAX_VAULT_LOCK_TIMEOUT_SECONDS
// (longest legitimate UI option, 1 year). Prevents attacker-minted immortal
// JWTs via unbounded `vaultLockTimeoutSeconds`. 0 means "never lock locally"
// in the UI, so map it to the default for token lifetimes.
export const MAX_VAULT_LOCK_TIMEOUT_SECONDS = 31_536_000
export const DEFAULT_VAULT_LOCK_TIMEOUT_SECONDS = 28_800
const MIN_TOKEN_TIMEOUT_SECONDS = 60

export const effectiveVaultLockTimeoutSeconds = (
  stored: number
): number => {
  if (!Number.isFinite(stored) || stored <= 0) {
    return DEFAULT_VAULT_LOCK_TIMEOUT_SECONDS
  }
  return Math.min(Math.max(Math.floor(stored), MIN_TOKEN_TIMEOUT_SECONDS), MAX_VAULT_LOCK_TIMEOUT_SECONDS)
}

export const assertValidVaultLockTimeoutSeconds = (value: number): void => {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_VAULT_LOCK_TIMEOUT_SECONDS
  ) {
    throw new GraphqlError(
      `vaultLockTimeoutSeconds must be an integer between 0 and ${MAX_VAULT_LOCK_TIMEOUT_SECONDS}`
    )
  }
}

export const setNewAccessTokenIntoCookie = (
  user: Pick<User, 'id' | 'tokenVersion'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>,
  ctx: IContext
) => {
  const accessToken = createAccessToken(user, device)

  ctx.reply.setCookie('access-token', accessToken, {
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return accessToken
}

export const createAccessToken = (
  user: Pick<User, 'id' | 'tokenVersion'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>
) =>
  sign(
    {
      userId: user.id,
      deviceId: device.id,
      // tokenVersion lets the server invalidate already-issued access tokens
      // (e.g. on master-device reset or password change) by bumping the
      // user.tokenVersion column.
      tokenVersion: user.tokenVersion
    },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      jwtid: crypto.randomUUID(),
      expiresIn: `${Math.floor(effectiveVaultLockTimeoutSeconds(device.vaultLockTimeoutSeconds) / 3)}s`
    }
  )

export interface jwtPayloadRefreshToken extends JwtPayload {
  userId: string
  deviceId: string
  tokenVersion: number
}

export const setNewRefreshToken = (
  user: Pick<User, 'id' | 'tokenVersion'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>,
  ctx: IContext
) => {
  const refreshToken = createRefreshToken(user, device)

  ctx.reply.setCookie('refresh-token', refreshToken, {
    maxAge: effectiveVaultLockTimeoutSeconds(device.vaultLockTimeoutSeconds),
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return refreshToken
}

export const createRefreshToken = (
  user: Pick<User, 'id' | 'tokenVersion'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>
) => {
  const payload = {
    userId: user.id,
    deviceId: device.id,
    tokenVersion: user.tokenVersion
  }
  return sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    jwtid: crypto.randomUUID(),
    expiresIn: `${effectiveVaultLockTimeoutSeconds(device.vaultLockTimeoutSeconds)}s`
  })
}

export const createAuthTokens = (
  user: Pick<User, 'id' | 'tokenVersion'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>
) => ({
  accessToken: createAccessToken(user, device),
  refreshToken: createRefreshToken(user, device)
})
