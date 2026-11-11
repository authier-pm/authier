import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewDeviceApprovalPolicy } from '@shared/newDeviceApproval'
import {
  NewDeviceApprovalOnboarding,
  NewDeviceApprovalSettings
} from './NewDeviceApprovalSettings'

const api = vi.hoisted(() => ({
  read: vi.fn(),
  update: vi.fn(),
  currentDeviceId: 'master'
}))

vi.mock('@/providers/VaultSessionProvider', () => ({
  useVaultSession: () => ({
    session: { currentDevice: { id: api.currentDeviceId } }
  })
}))

vi.mock('@/lib/orpc', () => ({
  orpc: {
    security: {
      get: {
        queryOptions: () => ({ queryKey: ['security'], queryFn: api.read })
      }
    }
  },
  orpcClient: { security: { updateNewDevicePolicy: api.update } }
}))

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true
    }
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false
    }
  })
})

const renderApproval = (
  policy: NewDeviceApprovalPolicy | null,
  onboarding = false
) => {
  api.read.mockResolvedValue({
    security: { newDevicePolicy: policy, masterDeviceId: 'master' }
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={client}>
      {onboarding ? (
        <NewDeviceApprovalOnboarding />
      ) : (
        <NewDeviceApprovalSettings />
      )}
    </QueryClientProvider>
  )
}

describe('new device approval choices', () => {
  beforeEach(() => {
    api.currentDeviceId = 'master'
    api.read.mockReset()
    api.update.mockReset().mockImplementation(async ({ newDevicePolicy }) => ({
      security: { newDevicePolicy, masterDeviceId: 'master' }
    }))
  })

  it('requires an explicit selection and dismisses onboarding after saving', async () => {
    renderApproval(null, true)
    const save = await screen.findByRole('button', {
      name: 'Save approval methods'
    })
    expect(save).toBeDisabled()
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: 'Another Authier device'
      })
    )
    await userEvent.click(save)
    expect(api.update).toHaveBeenCalledWith({ newDevicePolicy: 'OTHER_DEVICE' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
  })

  it('persists the requirement for both approvals when both methods are selected', async () => {
    renderApproval('EMAIL')
    await userEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Another Authier device'
      })
    )
    await userEvent.click(
      screen.getByRole('radio', { name: /Require both approvals/ })
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Save approval methods' })
    )
    expect(api.update).toHaveBeenCalledWith({
      newDevicePolicy: 'EMAIL_AND_OTHER_DEVICE'
    })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save approval methods' })
      ).toBeDisabled()
    )
    expect(
      screen.getByRole('radio', { name: /Require both approvals/ })
    ).toBeChecked()
  })

  it('shows configured approval settings as read-only away from the master device', async () => {
    api.currentDeviceId = 'other-device'
    renderApproval('EMAIL_AND_OTHER_DEVICE')
    expect(
      await screen.findByText(
        'Open your master device to change approval settings.'
      )
    ).toBeVisible()
    for (const checkbox of screen.getAllByRole('checkbox'))
      expect(checkbox).toBeDisabled()
    for (const radio of screen.getAllByRole('radio'))
      expect(radio).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Save approval methods' })
    ).toBeDisabled()
    expect(api.update).not.toHaveBeenCalled()
  })

  it('still allows an unconfigured account to choose from another enrolled device', async () => {
    api.currentDeviceId = 'other-device'
    renderApproval(null, true)
    await userEvent.click(
      await screen.findByRole('checkbox', { name: 'Email' })
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Save approval methods' })
    )
    expect(api.update).toHaveBeenCalledWith({ newDevicePolicy: 'EMAIL' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
  })

  it('keeps the selected policy on errors and never saves zero methods', async () => {
    api.update.mockRejectedValueOnce(
      new Error('Unable to save approval methods')
    )
    renderApproval('OTHER_DEVICE')
    const device = await screen.findByRole('checkbox', {
      name: 'Another Authier device'
    })
    await userEvent.click(device)
    expect(
      screen.getByRole('button', { name: 'Save approval methods' })
    ).toBeDisabled()
    expect(api.update).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Email' }))
    await userEvent.click(
      screen.getByRole('button', { name: 'Save approval methods' })
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to save approval methods'
    )
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeChecked()
    await userEvent.click(
      screen.getByRole('button', { name: 'Save approval methods' })
    )
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    )
    expect(api.update).toHaveBeenLastCalledWith({ newDevicePolicy: 'EMAIL' })
  })
})
