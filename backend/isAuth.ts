import { MiddlewareFn } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import { IContext } from './RootResolver'

export const isAuth: MiddlewareFn<IContext> = ({ context }, next) => {
  const authorization = context.request.headers['authorization']

  if (!authorization) {
    throw new Error('not authenticated')
  }

  try {
    const token = authorization.split(' ')[1]
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
    // @ts-expect-error
    context.payload = payload as any
  } catch (err) {
    throw new Error('not authenticated')
  }

  return next()
}
