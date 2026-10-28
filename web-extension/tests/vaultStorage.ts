import { vi } from 'vitest'
import browser from 'webextension-polyfill'

/** Browser storage survives constructing another DeviceState in restart tests. */
export function mockPersistentVaultStorage() {
  const local: Record<string, unknown> = {}
  const session: Record<string, unknown> = {}
  for (const [area, data] of [
    [browser.storage.local, local],
    [browser.storage.session, session]
  ] as const) {
    vi.mocked(area.get).mockImplementation(async (keys) => {
      if (keys === null || keys === undefined) return structuredClone(data)
      const names = typeof keys === 'string' ? [keys] : Object.keys(keys)
      const selected = Array.isArray(keys) ? keys : names
      return structuredClone(
        Object.fromEntries(
          selected.filter((key) => key in data).map((key) => [key, data[key]])
        )
      )
    })
    vi.mocked(area.set).mockImplementation(async (values) => {
      Object.assign(data, structuredClone(values))
    })
    vi.mocked(area.remove).mockImplementation(async (keys) => {
      for (const key of typeof keys === 'string' ? [keys] : keys)
        delete data[key]
    })
    if (area.clear)
      vi.mocked(area.clear).mockImplementation(async () => {
        for (const key of Object.keys(data)) delete data[key]
      })
  }
  return { local, session }
}

export function mockVaultLocks() {
  // Shared saves do not wait for network uploads. Exclusive queue drains are
  // serialized; browser integration tests exercise Chromium's real Web Locks.
  const tails = new Map<string, Promise<unknown>>()
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: vi.fn(
        (
          name: string,
          options: LockOptions | (() => Promise<unknown>),
          callback?: () => Promise<unknown>
        ) => {
          const work = typeof options === 'function' ? options : callback!
          if (typeof options !== 'function' && options.mode === 'shared')
            return work()
          const result = (tails.get(name) ?? Promise.resolve()).then(work, work)
          tails.set(
            name,
            result.catch(() => {})
          )
          return result
        }
      )
    }
  })
}
