import type { MiddlewareFn } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import type {
  IContextAuthenticated,
  IJWTPayload
} from '../models/types/ContextTypes'
import { GraphqlErrorUnauthorized } from './GraphqlError'

export const throwIfNotAuthenticated: MiddlewareFn<
  IContextAuthenticated
> = async ({ context }, next) => {
  let token: string | undefined

  if (context.request.cookies['access-token']) {
    token = context.request.cookies['access-token']
  } else {
    const authorization = context.request.headers['authorization']
    token = authorization?.split(' ')[1]
  }

  if (!token) {
    context.reply.clearCookie('access-token')
    throw new GraphqlErrorUnauthorized('not authenticated')
  }
  let jwtPayload: IJWTPayload
  try {
    jwtPayload = verify(token, process.env.ACCESS_TOKEN_SECRET!) as IJWTPayload

    context.jwtPayload = jwtPayload
  } catch (err) {
    context.reply.clearCookie('access-token')

    throw new GraphqlErrorUnauthorized('not authenticated')
  }

  const currentDevice = await context.db.query.device.findFirst({
    where: {
      id: jwtPayload.deviceId
    }
  })

  if (!currentDevice) {
    context.reply.clearCookie('access-token')
    throw new GraphqlErrorUnauthorized('not authenticated')
  }

  if (currentDevice?.logoutAt) {
    context.reply.clearCookie('access-token')

    throw new GraphqlErrorUnauthorized('not authenticated')
  }
  context.device = currentDevice

  const user = await context.db.query.user.findFirst({
    where: {
      id: context.jwtPayload.userId
    },
    columns: {
      masterDeviceId: true
    }
  })

  if (!user) {
    context.reply.clearCookie('access-token')
    throw new GraphqlErrorUnauthorized('not authenticated')
  }
  context.masterDeviceId = user.masterDeviceId

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
