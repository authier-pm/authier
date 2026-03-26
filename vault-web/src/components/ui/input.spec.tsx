import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Input } from './input'

const clipboardMocks = vi.hoisted(() => ({
  copyTextToClipboard: vi.fn()
}))

vi.mock('@/lib/clipboard', () => ({
  copyTextToClipboard: clipboardMocks.copyTextToClipboard
}))

describe('Input', () => {
  it('toggles password visibility for password inputs', async () => {
    const user = userEvent.setup()

    render(<Input aria-label="Password" defaultValue="hunter2" type="password" />)

    const input = screen.getByLabelText('Password')

    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))

    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))

    expect(input).toHaveAttribute('type', 'password')
  })

  it('copies the current password value', async () => {
    const user = userEvent.setup()
    clipboardMocks.copyTextToClipboard.mockReset()
    clipboardMocks.copyTextToClipboard.mockResolvedValue(undefined)

    render(<Input aria-label="Password" defaultValue="hunter2" type="password" />)

    await user.click(screen.getByRole('button', { name: 'Copy password' }))

    expect(clipboardMocks.copyTextToClipboard).toHaveBeenCalledWith('hunter2')
  })
})
