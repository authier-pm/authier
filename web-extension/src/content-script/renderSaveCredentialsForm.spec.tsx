import { invalidateContentVaultSession } from './contentVaultSession'
import {
  loginPrompt,
  removeSaveCredentialsForm,
  renderSaveCredentialsForm
} from './renderSaveCredentialsForm'

const { query, save } = vi.hoisted(() => ({
  query: vi.fn(),
  save: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('./connectTRPC', () => ({
  trpc: {
    getCapturedInputEvents: { query },
    saveLoginCredentialsModalShown: { mutate: save }
  }
}))
vi.mock('./components/PromptPassword', () => ({ PromptPassword: () => null }))

afterEach(() => {
  invalidateContentVaultSession()
  removeSaveCredentialsForm()
  vi.clearAllMocks()
})

it('does not recreate a password prompt from a response received after locking', async () => {
  let resolve!: (value: { capturedInputEvents: [] }) => void
  query.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    })
  )
  const rendering = renderSaveCredentialsForm(
    'test@example.com',
    'saved-password'
  )
  invalidateContentVaultSession()
  removeSaveCredentialsForm()
  resolve({ capturedInputEvents: [] })
  await rendering
  expect(loginPrompt).toBeNull()
  expect(document.getElementById('authier-save-prompt')).toBeNull()
  expect(save).not.toHaveBeenCalled()
})
