import ms from 'ms'

import { GraphQLError } from 'graphql'
import { Redis } from '@upstash/redis'

export class RateLimitedError extends GraphQLError {
  constructor(message: string, errorCode: string) {
    super(message, {
      extensions: {
        code: errorCode
      }
    })
  }
}

export class RedisBasicRateLimiter {
  duration: string
  constructor(
    private redisClient: Redis,
    private options: {
      limiterPrefix: string
      maxHits: number
      intervalSeconds: number
    }
  ) {
    this.duration = ms(this.options.intervalSeconds * 1000, {
      long: true
    })
  }
  getKey(ip: string) {
    return `${this.options.limiterPrefix}_rate_limit_counter:${ip}`
  }

  /**
   * @param resourceKey can be an ip address or a user idjk
   */
  async increment(resourceKey: string) {
    const key = this.getKey(resourceKey)
    const res = await this.redisClient
      .multi()
      .incr(key)
      .expire(key, this.options.intervalSeconds)
      .exec()

    if (res && res[0] > this.options.maxHits) {
      throw new RateLimitedError(
        `rate limit exceeded, try in ${this.duration}`,
        'RATE_LIMIT_EXCEEDED'
      )
    }
  }

  async reset(ip: string) {
    const key = this.getKey(ip)
    await this.redisClient.del(key)
  }
}
