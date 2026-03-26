import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VaultEditPage } from './VaultEditPage'

const useVaultSessionMock = vi.fn()

vi.mock('@/providers/VaultSessionProvider', () => ({
  useVaultSession: () => useVaultSessionMock()
}))

describe('VaultEditPage', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(59_000)

    useVaultSessionMock.mockReturnValue({
      createLoginSecret: vi.fn(),
      createTotpSecret: vi.fn(),
      deleteSecret: vi.fn(),
      decryptedSecrets: [
        {
          id: 'totp-secret',
          encrypted: 'encrypted-1',
          kind: 'TOTP',
          version: 1,
          createdAt: new Date('2026-03-25T10:05:00.000Z').toISOString(),
          updatedAt: null,
          totp: {
            label: 'Cloudflare',
            url: 'https://dash.cloudflare.com',
            iconUrl: null,
            secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
            digits: 6,
            period: 30,
            androidUri: null,
            iosUri: null
          }
        }
      ],
      updateLoginSecret: vi.fn(),
      updateTotpSecret: vi.fn()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the live TOTP token on an existing TOTP item detail page', async () => {
    render(
      <MemoryRouter initialEntries={['/vault/totp-secret']}>
        <Routes>
          <Route element={<VaultEditPage />} path="/vault/:secretId" />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Current token')).toBeInTheDocument()
    expect(await screen.findByText('287 082')).toBeInTheDocument()
    expect(screen.getByText('Expires in 1s. Click the token to copy it.')).toBeInTheDocument()
  })
})
