import { JwtPayload, sign } from 'jsonwebtoken'
import { Device, User } from './generated/typegraphql-prisma'
import { isProd } from './envUtils'
import { IContext } from './RootResolver'

export const setNewAccessTokenIntoCookie = (
  user: User,
  deviceId: string,
  ctx: IContext
) => {
  const accessToken = sign(
    { userId: user.id, deviceId: deviceId },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: '60m'
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
  user: User,
  deviceId: string,

  ctx: IContext
) => {
  const payload = {
    userId: user.id,
    deviceId: deviceId,
    tokenVersion: user.tokenVersion
  }
  const refreshToken = sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '1825d' // 5 years. In 5 years user has to approve the device again as it's refresh token will expire
  })
  ctx.reply.setCookie('refresh-token', refreshToken, {
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return refreshToken
}
