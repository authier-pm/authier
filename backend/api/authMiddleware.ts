import { MiddlewareFn } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import { IContextAuthenticated } from '../schemas/RootResolver'
import { IJWTPayload } from '../schemas/RootResolver'

export const throwIfNotAuthenticated: MiddlewareFn<IContextAuthenticated> = (
  { context },
  next
) => {
  let token: string | undefined

  if (context.request.cookies['access-token']) {
    token = context.request.cookies['access-token']
  } else {
    const authorization = context.request.headers['authorization']
    token = authorization?.split(' ')[1]
  }

  if (!token) {
    context.reply.clearCookie('access-token')
    throw new Error('not authenticated')
  }

  try {
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)

    context.jwtPayload = payload as IJWTPayload
  } catch (err) {
    context.reply.clearCookie('access-token')

    throw new Error('not authenticated')
  }

  return next()
}

export const authenticateFromToken: MiddlewareFn<IContextAuthenticated> = (
  { context },
  next
) => {
  let token: string | undefined

  if (context.request.cookies['access-token']) {
    token = context.request.cookies['access-token']
  } else {
    const authorization = context.request.headers['authorization']
    token = authorization?.split(' ')[1]
  }

  if (!token) {
    return next()
  }

  try {
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)

    context.jwtPayload = payload as IJWTPayload
  } catch (err) {
    context.reply.clearCookie('access-token')
  }

  return next()
}
