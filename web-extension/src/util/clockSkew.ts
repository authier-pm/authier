import browser from 'webextension-polyfill'
import { z } from 'zod'

export const CLOCK_SKEW_STORAGE_KEY = 'clockSkew'
const WARNING_THRESHOLD_MS = 10_000
const MAX_ROUND_TRIP_MS = 5_000
const MAX_CLOCK_CHANGE_MS = 1_000

export const clockSkewSchema = z.object({
  // Positive offsets mean the device clock is ahead of the server.
  offsetMs: z.number(),
  uncertaintyMs: z.number().nonnegative(),
  checkedAt: z.number()
})
export type ClockSkew = z.infer<typeof clockSkewSchema>

type ClockSkewMeasurement = {
  serverTime: string
  startedAt: number
  finishedAt: number
  elapsedMs: number
}

export const isClockSkewWarning = ({ offsetMs, uncertaintyMs }: ClockSkew) =>
  Math.abs(offsetMs) - uncertaintyMs > WARNING_THRESHOLD_MS

export const measureClockSkew = ({
  serverTime,
  startedAt,
  finishedAt,
  elapsedMs
}: ClockSkewMeasurement): ClockSkew | null => {
  if (
    !z.iso.datetime().safeParse(serverTime).success ||
    ![startedAt, finishedAt, elapsedMs].every(Number.isFinite) ||
    elapsedMs < 0 ||
    elapsedMs > MAX_ROUND_TRIP_MS ||
    finishedAt < startedAt ||
    Math.abs(finishedAt - startedAt - elapsedMs) > MAX_CLOCK_CHANGE_MS
  )
    return null

  return {
    offsetMs: (startedAt + finishedAt) / 2 - Date.parse(serverTime),
    // The timestamp was generated within this request. Small wall-clock
    // adjustments also widen the range instead of producing false warnings.
    uncertaintyMs:
      (elapsedMs + Math.abs(finishedAt - startedAt - elapsedMs)) / 2,
    checkedAt: finishedAt
  }
}

export const recordClockSkew = async (measurement: ClockSkewMeasurement) => {
  const sample = measureClockSkew(measurement)
  // An unreliable response must not clear an existing warning.
  if (sample) {
    await browser.storage.session.set({ [CLOCK_SKEW_STORAGE_KEY]: sample })
  }
}
