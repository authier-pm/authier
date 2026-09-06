import 'fake-indexeddb/auto'
import { forgetRememberedVault } from '@shared/rememberedVault'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { setAccessToken } from '@/lib/accessToken'

afterEach(async () => {
  cleanup()
  await forgetRememberedVault()
  setAccessToken(null)
  window.localStorage.clear()
})
