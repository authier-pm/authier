import { beforeEach, describe, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  CLOCK_SKEW_STORAGE_KEY,
  isClockSkewWarning,
  measureClockSkew,
  recordClockSkew,
  type ClockSkew
} from './clockSkew'

const startedAt = Date.parse('2026-10-17T12:00:00.000Z')

const measurement = (offsetMs: number, elapsedMs = 200) => ({
  startedAt,
  finishedAt: startedAt + elapsedMs,
  elapsedMs,
  serverTime: new Date(startedAt + elapsedMs / 2 - offsetMs).toISOString()
})

const sample = (offsetMs: number, uncertaintyMs = 0): ClockSkew => ({
  offsetMs,
  uncertaintyMs,
  checkedAt: startedAt
})

beforeEach(() => {
  vi.mocked(browser.storage.session.set).mockReset()
  vi.mocked(browser.storage.session.set).mockResolvedValue(undefined)
})

describe('clock skew measurement', () => {
  it.each([20_000, -20_000])(
    'measures %ims skew against the request midpoint',
    (offsetMs) => {
      expect(measureClockSkew(measurement(offsetMs))).toEqual({
        offsetMs,
        uncertaintyMs: 100,
        checkedAt: startedAt + 200
      })
    }
  )

  it('accepts an instantaneous response and the maximum reliable duration', () => {
    expect(measureClockSkew(measurement(0, 0))).toEqual(sample(0))
    expect(measureClockSkew(measurement(20_000, 5_000))).toEqual({
      offsetMs: 20_000,
      uncertaintyMs: 2_500,
      checkedAt: startedAt + 5_000
    })
  })

  it.each([-500, 500])(
    'accounts for an accepted %ims clock adjustment in its uncertainty',
    (adjustmentMs) => {
      const request = measurement(20_000, 1_000)
      const result = measureClockSkew({
        ...request,
        finishedAt: request.finishedAt + adjustmentMs
      })

      expect(result).toEqual({
        offsetMs: 20_000 + adjustmentMs / 2,
        uncertaintyMs: 750,
        checkedAt: request.finishedAt + adjustmentMs
      })
    }
  )

  it.each([
    '',
    '1',
    '2026-10-17',
    'not-a-timestamp',
    '2026-13-17T12:00:00.000Z'
  ])('rejects an invalid server timestamp: %s', (serverTime) => {
    expect(measureClockSkew({ ...measurement(20_000), serverTime })).toBeNull()
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 5_001])(
    'rejects an unreliable monotonic duration: %s',
    (elapsedMs) => {
      expect(measureClockSkew({ ...measurement(20_000), elapsedMs })).toBeNull()
    }
  )

  it.each([
    { startedAt: Number.NaN },
    { finishedAt: Number.POSITIVE_INFINITY },
    { finishedAt: startedAt - 1 },
    { finishedAt: startedAt + 200 + 1_001 },
    { finishedAt: startedAt + 2_000 - 1_001, elapsedMs: 2_000 }
  ])(
    'rejects invalid wall-clock timing or a mid-request clock adjustment: %j',
    (timing) => {
      expect(measureClockSkew({ ...measurement(20_000), ...timing })).toBeNull()
    }
  )
})

describe('clock skew warning', () => {
  it.each([10_000, -10_000])(
    'does not warn at the %ims threshold',
    (offsetMs) => {
      expect(isClockSkewWarning(sample(offsetMs))).toBe(false)
    }
  )

  it.each([10_001, -10_001])(
    'warns just beyond the %ims threshold',
    (offsetMs) => {
      expect(isClockSkewWarning(sample(offsetMs))).toBe(true)
    }
  )

  it.each([10_100, -10_100])(
    'withholds a warning when uncertainty reaches the 10s threshold: %ims',
    (offsetMs) => {
      expect(isClockSkewWarning(sample(offsetMs, 100))).toBe(false)
    }
  )

  it.each([10_101, -10_101])(
    'warns when the entire uncertainty range exceeds 10s: %ims',
    (offsetMs) => {
      expect(isClockSkewWarning(sample(offsetMs, 100))).toBe(true)
    }
  )
})

describe('clock skew storage', () => {
  it('replaces a warning with a healthy sample after the system clock is fixed', async () => {
    await recordClockSkew(measurement(20_000))
    await recordClockSkew(measurement(0))

    expect(browser.storage.session.set).toHaveBeenNthCalledWith(1, {
      [CLOCK_SKEW_STORAGE_KEY]: {
        offsetMs: 20_000,
        uncertaintyMs: 100,
        checkedAt: startedAt + 200
      }
    })
    expect(browser.storage.session.set).toHaveBeenNthCalledWith(2, {
      [CLOCK_SKEW_STORAGE_KEY]: {
        offsetMs: 0,
        uncertaintyMs: 100,
        checkedAt: startedAt + 200
      }
    })
  })

  it('preserves the previous sample when a later measurement is unreliable', async () => {
    await recordClockSkew(measurement(20_000))
    await recordClockSkew({ ...measurement(0), serverTime: 'invalid' })
    await recordClockSkew({ ...measurement(0), elapsedMs: 5_001 })

    expect(browser.storage.session.set).toHaveBeenCalledTimes(1)
  })

  it('propagates a storage failure so the caller can handle it separately from vault sync', async () => {
    const storageError = new Error('Session storage is unavailable')
    vi.mocked(browser.storage.session.set).mockRejectedValueOnce(storageError)

    await expect(recordClockSkew(measurement(20_000))).rejects.toBe(
      storageError
    )
  })
})
