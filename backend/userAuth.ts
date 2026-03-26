import type { InferSelectModel } from 'drizzle-orm'
import type { user, device } from './drizzle/schema'
type User = InferSelectModel<typeof user>
type Device = InferSelectModel<typeof device>
import type { JwtPayload } from 'jsonwebtoken'
import { sign } from 'jsonwebtoken'

import { isProd } from './envUtils'
import type { IContext } from './models/types/ContextTypes'

export const setNewAccessTokenIntoCookie = (
  user: Pick<User, 'id'>,
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
  user: Pick<User, 'id'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>
) =>
  sign(
    { userId: user.id, deviceId: device.id },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      jwtid: crypto.randomUUID(),
      expiresIn: `${Math.floor(device.vaultLockTimeoutSeconds / 3)}s`
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
    expiresIn: `${device.vaultLockTimeoutSeconds}s`
  })
}

export const createAuthTokens = (
  user: Pick<User, 'id' | 'tokenVersion'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>
) => ({
  accessToken: createAccessToken(user, device),
  refreshToken: createRefreshToken(user, device)
})
