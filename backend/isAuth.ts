import { MiddlewareFn } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import { IContext } from './RootResolver'

export const isAuth: MiddlewareFn<IContext> = ({ context }, next) => {
  // console.log('~ context.request.cookie', context.request.cookies)
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

    // @ts-expect-error
    context.payload = payload as any
  } catch (err) {
    context.reply.clearCookie('access-token')

    throw new Error('not authenticated')
  }

  return next()
}
