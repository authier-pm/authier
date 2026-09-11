import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TotpCodeCard } from './TotpCodeCard'

const clipboardMocks = vi.hoisted(() => ({
  copyTextToClipboard: vi.fn()
}))

vi.mock('@/lib/clipboard', () => ({
  copyTextToClipboard: clipboardMocks.copyTextToClipboard
}))

const renderTokenCard = async () => {
  // Flush token generation and its effects before interacting with the tile.
  await act(async () => {
    render(
      <TotpCodeCard
        digits={6}
        label="Cloudflare"
        period={30}
        secret="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
      />
    )
  })
}

const copyToken = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /287 082/i }))
  })
}

const advanceTime = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

describe('TotpCodeCard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(31_000)
    clipboardMocks.copyTextToClipboard.mockReset()
    clipboardMocks.copyTextToClipboard.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('copies the current token and shows feedback for 1.5 seconds', async () => {
    await renderTokenCard()
    await copyToken()

    expect(clipboardMocks.copyTextToClipboard).toHaveBeenCalledExactlyOnceWith(
      '287082'
    )
    expect(screen.getByText('Copied to clipboard.')).toBeInTheDocument()

    await advanceTime(1499)
    expect(screen.getByText('Copied to clipboard.')).toBeInTheDocument()

    await advanceTime(1)
    expect(screen.queryByText('Copied to clipboard.')).not.toBeInTheDocument()
    expect(screen.getByText(/Click the token to copy it\./)).toBeInTheDocument()
  })

  it('clears copy feedback when the token rolls over', async () => {
    vi.setSystemTime(59_000)
    await renderTokenCard()
    await copyToken()
    expect(screen.getByText('Copied to clipboard.')).toBeInTheDocument()

    await advanceTime(1000)

    expect(screen.getByRole('button', { name: /359 152/i })).toBeInTheDocument()
    expect(screen.queryByText('Copied to clipboard.')).not.toBeInTheDocument()
    expect(clipboardMocks.copyTextToClipboard).toHaveBeenCalledExactlyOnceWith(
      '287082'
    )
  })

  it('does not report success when the clipboard write fails', async () => {
    clipboardMocks.copyTextToClipboard.mockRejectedValue(
      new Error('Clipboard access denied')
    )
    await renderTokenCard()
    await copyToken()

    expect(clipboardMocks.copyTextToClipboard).toHaveBeenCalledExactlyOnceWith(
      '287082'
    )
    expect(screen.queryByText('Copied to clipboard.')).not.toBeInTheDocument()
    expect(screen.getByText(/Click the token to copy it\./)).toBeInTheDocument()
  })
})
