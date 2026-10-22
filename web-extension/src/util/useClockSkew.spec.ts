import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import { CLOCK_SKEW_STORAGE_KEY, type ClockSkew } from './clockSkew'
import { useClockSkew } from './useClockSkew'

type StorageListener = Parameters<
  typeof browser.storage.onChanged.addListener
>[0]
const listeners = new Set<StorageListener>()
const skewed: ClockSkew = {
  offsetMs: 45_000,
  uncertaintyMs: 500,
  checkedAt: 1_790_000_000_000
}
const healthy: ClockSkew = { ...skewed, offsetMs: 2000 }

const emit = (value: unknown, area = 'session') => {
  for (const listener of listeners)
    listener({ [CLOCK_SKEW_STORAGE_KEY]: { newValue: value } }, area)
}

beforeEach(() => {
  vi.mocked(browser.storage.session.get)
    .mockReset()
    .mockResolvedValue({ [CLOCK_SKEW_STORAGE_KEY]: skewed })
  vi.mocked(browser.storage.onChanged.addListener).mockImplementation(
    (listener) => {
      listeners.add(listener)
    }
  )
  vi.mocked(browser.storage.onChanged.removeListener).mockImplementation(
    (listener) => {
      listeners.delete(listener)
    }
  )
})

afterEach(() => {
  cleanup()
  listeners.clear()
  vi.restoreAllMocks()
})

it('loads the previous sync and observes a corrected sync', async () => {
  const { result } = renderHook(useClockSkew)
  await act(async () => {})
  expect(result.current).toEqual(skewed)
  act(() => emit(healthy))
  expect(result.current).toEqual(healthy)
})

it('ignores malformed samples and changes from another storage area', async () => {
  const { result } = renderHook(useClockSkew)
  await act(async () => {})
  act(() => {
    emit({ offsetMs: 'unknown' })
    emit(healthy, 'local')
  })
  expect(result.current).toEqual(skewed)
  act(() => emit(undefined))
  expect(result.current).toBeNull()
})

it('does not overwrite a newer sync with a delayed initial read', async () => {
  let resolveInitial: ((value: Record<string, unknown>) => void) | undefined
  vi.mocked(browser.storage.session.get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveInitial = resolve
      })
  )
  const { result } = renderHook(useClockSkew)
  act(() => emit(healthy))
  await act(async () => {
    resolveInitial?.({ [CLOCK_SKEW_STORAGE_KEY]: skewed })
  })
  expect(result.current).toEqual(healthy)
})

it('unsubscribes when the popup closes and reads the sample when reopened', async () => {
  const first = renderHook(useClockSkew)
  await act(async () => {})
  first.unmount()
  expect(listeners.size).toBe(0)
  const reopened = renderHook(useClockSkew)
  await act(async () => {})
  expect(reopened.result.current).toEqual(skewed)
})

it('continues listening after an initial storage read fails', async () => {
  const error = new Error('Storage is temporarily unavailable')
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.mocked(browser.storage.session.get).mockRejectedValueOnce(error)
  const { result } = renderHook(useClockSkew)
  await act(async () => {})
  expect(warn).toHaveBeenCalledWith(
    'Could not read the last clock check',
    error
  )
  expect(result.current).toBeNull()
  act(() => emit(skewed))
  expect(result.current).toEqual(skewed)
})
