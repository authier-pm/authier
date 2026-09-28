import debug from 'debug'
import { tc } from './tc'

const log = debug('au:trpc')

export const loggerMiddleware = tc.middleware(async ({ path, type, next }) => {
  const start = Date.now()
  const result = await next()
  const durationMs = Date.now() - start

  log({ path, type, durationMs, ok: result.ok })
  return result
})
