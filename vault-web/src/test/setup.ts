import 'fake-indexeddb/auto'
import { forgetDeviceUnlock } from '@shared/deviceUnlock'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

Object.defineProperty(navigator, 'locks', {
  configurable: true,
  value: {
    request: (_name: string, callback: () => Promise<unknown>) => callback()
  }
})
import { setAccessToken } from '@/lib/accessToken'

afterEach(async () => {
  cleanup()
  await forgetDeviceUnlock()
  setAccessToken(null)
  window.localStorage.clear()
})
