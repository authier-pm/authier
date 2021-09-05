import { MiddlewareFn } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import { IContext } from './RootResolver'

export const isAuth: MiddlewareFn<IContext> = ({ context }, next) => {
  // console.log('~ context.request.cookie', context.request.cookies)
  let token: string | undefined

  // @ts-expect-error
  if (context.request.cookies.jid) {
    // @ts-expect-error
    token = context.request.cookies.jid
  } else {
    const authorization = context.request.headers['authorization']
    token = authorization?.split(' ')[1]
  }

  if (!token) {
    throw new Error('not authenticated')
  }

  try {
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
    // @ts-expect-error
    context.payload = payload as any
  } catch (err) {
    throw new Error('not authenticated')
  }

  return next()
}
