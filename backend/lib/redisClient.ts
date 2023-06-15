import Redis from 'ioredis'

console.log('process.env.REDIS_URL :', process.env.REDIS_URL)

export const redisClient = new Redis(process.env.REDIS_URL as string, {
  enableAutoPipelining: true
})
