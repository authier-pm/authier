import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'

import { memRedis } from './memRedis'
import { redisClient } from './redisClient'

describe('memRedis', () => {
  let sampleFn: { memoized: any; clear?: () => Promise<number> }

  let evalCount = 0
  //  function to be memoized
  const sampleFunction = async (arg: number): Promise<number> => {
    evalCount++
    return arg * 2
  }
  beforeEach(async () => {
    sampleFn = memRedis(sampleFunction, {
      cacheKey: (args) => `test-key-${args[0]}`,
      maxAge: 60,
      cachePrefix: 'test-prefix'
    })
  })

  afterAll(async () => {
    await redisClient.flushall()
  })

  afterEach(async () => {
    evalCount = 0
  })

  it('should cache a value after first call (cache miss)', async () => {
    const result = await sampleFn.memoized(1)
    expect(result).toBe(2)
    // Check Redis to confirm the value is cached
    const cachedValue = await redisClient.get('test-prefix_test-key-1')
    expect(JSON.parse(cachedValue as string)).toBe(2)
  })

  it('should return cached value on subsequent calls (cache hit)', async () => {
    const res = await sampleFn.memoized(2)

    expect(res).toBe(4)
    // Second call should hit the cache
    const result = await sampleFn.memoized(2)
    console.log('result:', result)
    expect(evalCount).toBe(1)

    expect(result).toBe(4)
  })

  it('should clear the cache correctly', async () => {
    await sampleFn.memoized(3)
    // Clear the cache
    const { clear } = memRedis(sampleFunction, {
      maxAge: 60,
      cachePrefix: 'test-prefix'
    })
    await clear()
    // Cache should be empty now
    const cachedValue = await redisClient.get('test-prefix_test-key-3')
    expect(cachedValue).toBeNull()
  })
})
