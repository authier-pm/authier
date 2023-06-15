import { Redis } from '@upstash/redis'

console.log(
  'process.env.UPSTASH_REDIS_REST_URL :',
  process.env.UPSTASH_REDIS_REST_URL
)

const env = process.env

export const redisClient = new Redis({
  url: env.UPSTASH_REDIS_REST_URL as string,
  token: env.UPSTASH_REDIS_REST_TOKEN as string
})

redisClient.ping().then((res) => console.log('redis', res))
