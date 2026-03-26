import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { setAccessToken } from '@/lib/accessToken'

afterEach(() => {
  cleanup()
  setAccessToken(null)
  window.localStorage.clear()
})
