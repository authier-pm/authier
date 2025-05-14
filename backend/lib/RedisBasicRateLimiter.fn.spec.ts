import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { redisClient } from './redisClient'

import { RedisBasicRateLimiter } from './RedisBasicRateLimiter'

describe('RedisBasicRateLimiter', () => {
  const limiter = new RedisBasicRateLimiter(redisClient, {
    maxHits: 2,
    intervalSeconds: 10,
    limiterPrefix: 'test' // hour,
  })

  const reset = async () => {
    await limiter.reset('127.0.0.1')
  }
  beforeAll(reset)
  afterAll(reset)
  it('should not throw when hits are not exceeded', async () => {
    await limiter.increment('127.0.0.1')
    await limiter.increment('127.0.0.1')
  })
  it('should throw when max count of hits is exceeded', async () => {
    await expect(
      limiter.increment('127.0.0.1')
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[GraphQLError: rate limit exceeded, try in 10 seconds]`
    )
  })
})
