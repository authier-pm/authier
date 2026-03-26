import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VaultListPage } from './VaultListPage'

const useVaultSessionMock = vi.fn()

vi.mock('@/providers/VaultSessionProvider', () => ({
  useVaultSession: () => useVaultSessionMock()
}))

describe('VaultListPage', () => {
  beforeEach(() => {
    useVaultSessionMock.mockReturnValue({
      skippedSecretsCount: 0,
      decryptedSecrets: [
        {
          id: 'secret-1',
          encrypted: 'encrypted-1',
          kind: 'LOGIN_CREDENTIALS',
          version: 1,
          createdAt: new Date('2026-03-25T10:00:00.000Z').toISOString(),
          updatedAt: null,
          loginCredentials: {
            label: 'GitHub',
            url: 'https://github.com',
            iconUrl: null,
            username: 'capaj',
            password: 'hunter2',
            androidUri: null,
            iosUri: null
          }
        },
        {
          id: 'secret-2',
          encrypted: 'encrypted-2',
          kind: 'TOTP',
          version: 1,
          createdAt: new Date('2026-03-25T10:05:00.000Z').toISOString(),
          updatedAt: null,
          totp: {
            label: 'Cloudflare',
            url: 'https://dash.cloudflare.com',
            iconUrl: null,
            secret: 'ABC123',
            digits: 6,
            period: 30,
            androidUri: null,
            iosUri: null
          }
        }
      ]
    })
  })

  it('filters vault items by text search and secret kind', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <VaultListPage />
      </MemoryRouter>
    )

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Cloudflare')).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText(
        'Search by label, URL, username, password, or TOTP secret'
      ),
      'cloud'
    )

    expect(screen.queryByText('GitHub')).not.toBeInTheDocument()
    expect(screen.getByText('Cloudflare')).toBeInTheDocument()

    await user.clear(
      screen.getByPlaceholderText(
        'Search by label, URL, username, password, or TOTP secret'
      )
    )
    await user.click(screen.getByRole('button', { name: 'Passwords' }))

    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.queryByText('Cloudflare')).not.toBeInTheDocument()
  })
})
