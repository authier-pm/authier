import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import browser from 'webextension-polyfill'
import {
  CodeMessageKind,
  VERIFICATION_CODE_LIFETIME_MS,
  type VerificationCode
} from './verificationCodeProtocol'
import { useVerificationCodes } from './useVerificationCodes'

const code = (age: number): VerificationCode => ({
  provider: 'Gmail',
  sender: 'someone@example.com',
  code: '213456',
  id: crypto.randomUUID(),
  detectedAt: Date.now() - age,
  expiresAt: Date.now() + VERIFICATION_CODE_LIFETIME_MS,
  copied: false
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-05T12:00:00Z'))
  vi.mocked(browser.runtime.sendMessage).mockReset().mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

it('dismisses codes at least one second old and keeps codes just inside the grace period', async () => {
  const old = code(2000)
  const boundary = code(1000)
  const fresh = code(999)
  const { result } = renderHook(useVerificationCodes)
  await act(async () => {
    await result.current.dismissAll([old, boundary, fresh])
  })
  expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
    kind: CodeMessageKind.DISMISS_MANY,
    ids: [old.id, boundary.id]
  })
})

it('leaves an entirely fresh section untouched', async () => {
  const { result } = renderHook(useVerificationCodes)
  await act(async () => {
    await result.current.dismissAll([code(999), code(0)])
  })
  expect(browser.runtime.sendMessage).not.toHaveBeenCalledWith({
    kind: CodeMessageKind.DISMISS_MANY,
    ids: expect.anything()
  })
})
