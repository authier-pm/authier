import { Redis } from '@upstash/redis'

const env = process.env

export const redisClient = new Redis({
  url: env.UPSTASH_REDIS_REST_URL as string,
  token: env.UPSTASH_REDIS_REST_TOKEN as string
})
