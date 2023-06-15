import objectHash from 'object-hash'
import mimicFn from 'mimic-fn'
import { redisClient } from './redisClient'
import debug from 'debug'

const log = debug('ofd:memRedis')
// in many cases this is better than simple in memory memoization because it memoizes across multiple API instances
export const memRedis = <T>(
  fn: T,
  {
    cacheKey,
    maxAge,
    cachePrefix: prefix
  }: {
    cacheKey?: (args: any) => string
    /**
     * maxAge in seconds
     */
    maxAge: number | ((args: any) => number)
    cachePrefix: string // grep cachePrefix when adding a new cache to see if your name is unique
  }
): {
  memoized: T
  clear: () => Promise<number>
} => {
  const memoized = async function (...arguments_: any[]) {
    const key = [
      prefix,
      cacheKey ? cacheKey(arguments_) : objectHash(arguments_)
    ].join('_')

    const cacheItem = await redisClient.get(key)

    if (cacheItem) {
      log('cache hit', key)
      return JSON.parse(cacheItem).data
    }

    log('cache miss', key)
    // @ts-expect-error
    const result = await fn.apply(global, arguments_)

    if (maxAge) {
      await redisClient.setex(
        key,
        typeof maxAge === 'number' ? maxAge : maxAge(arguments_),
        JSON.stringify({ data: result })
      )
    } else {
      await redisClient.set(key, JSON.stringify({ data: result }))
    }

    return result
  }
  // @ts-expect-error
  mimicFn(memoized, fn)

  return {
    // @ts-expect-error
    memoized,
    /**
     * useful for tests when you want to clear all memoized functions
     */
    clear: async () => {
      const keys = await redisClient.keys(prefix + '*')
      if (keys.length === 0) {
        return 0
      }
      return redisClient.del(keys)
    },
    clearKey: async (...args: any[]) => {
      const key = [prefix, cacheKey ? cacheKey(args) : objectHash(args)].join(
        '_'
      )
      return await redisClient.del(key)
    }
  }
}
