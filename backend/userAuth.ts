import type { Device, User } from '@prisma/client'
import type { JwtPayload } from 'jsonwebtoken'
import { sign } from 'jsonwebtoken'

import { isProd } from './envUtils'
import type { IContext } from './models/types/ContextTypes'

export const setNewAccessTokenIntoCookie = (
  user: Pick<User, 'id'>,
  device: Pick<Device, 'id' | 'vaultLockTimeoutSeconds'>,
  ctx: IContext
) => {
  const accessToken = sign(
    { userId: user.id, deviceId: device.id },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: `${Math.floor(device.vaultLockTimeoutSeconds / 3)}s`
    }
  )

  ctx.reply.setCookie('access-token', accessToken, {
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return accessToken
}

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
  const payload = {
    userId: user.id,
    deviceId: device.id,
    tokenVersion: user.tokenVersion
  }
  const refreshToken = sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: `${device.vaultLockTimeoutSeconds}s`
  })

  ctx.reply.setCookie('refresh-token', refreshToken, {
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return refreshToken
}
