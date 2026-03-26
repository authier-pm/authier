import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TotpCodeCard } from './TotpCodeCard'

const clipboardMocks = vi.hoisted(() => ({
  copyTextToClipboard: vi.fn()
}))

vi.mock('@/lib/clipboard', () => ({
  copyTextToClipboard: clipboardMocks.copyTextToClipboard
}))

describe('TotpCodeCard', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(59_000)
    clipboardMocks.copyTextToClipboard.mockReset()
    clipboardMocks.copyTextToClipboard.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('copies the current token when the token tile is clicked', async () => {
    render(
      <TotpCodeCard
        digits={6}
        label="Cloudflare"
        period={30}
        secret="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
      />
    )

    const tokenButton = await screen.findByRole('button', { name: /287 082/i })
    fireEvent.click(tokenButton)

    expect(clipboardMocks.copyTextToClipboard).toHaveBeenCalledWith('287082')
    expect(await screen.findByText('Copied to clipboard.')).toBeInTheDocument()
  })
})
