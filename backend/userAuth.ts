import { sign } from 'jsonwebtoken'
import { User } from './generated/typegraphql-prisma'
import { isProd } from './envUtils'
import { IContext } from './RootResolver'

export const setNewAccessTokenIntoCookie = (user: User, ctx: IContext) => {
  const accessToken = sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: '20m'
    }
  )
  ctx.reply.setCookie('access-token', accessToken, {
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return accessToken
}

export const setNewRefreshToken = (user: User, ctx: IContext) => {
  const refreshToken = sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: '7d'
    }
  )
  ctx.reply.setCookie('jid', refreshToken, {
    secure: isProd, // send cookie over HTTPS only
    httpOnly: true,
    sameSite: true // alternative CSRF protection
  })

  return refreshToken
}
