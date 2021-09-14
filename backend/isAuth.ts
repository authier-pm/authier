import { MiddlewareFn } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import { IContext } from './RootResolver'

export const isAuth: MiddlewareFn<IContext> = ({ context }, next) => {
  // console.log('~ context.request.cookie', context.request.cookies)
  let token: string | undefined
  console.log('test', context.request)
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

    context.jwtPayload = payload as { userId: string }
  } catch (err) {
    context.reply.clearCookie('access-token')

    throw new Error('not authenticated')
  }

  return next()
}
