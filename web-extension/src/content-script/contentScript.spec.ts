import browser from 'webextension-polyfill'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'
import { vaultLockMessage } from '../util/vaultLockMessage'
import {
  clearContentScriptVault,
  domRecorder,
  refreshInputWatch,
  stateInitRes,
  type IInitStateRes
} from './contentScript'

const mocks = vi.hoisted(() => ({
  query: vi.fn<() => Promise<IInitStateRes | null>>().mockResolvedValue(null),
  stopAutofill: vi.fn(),
  stopPicker: vi.fn(),
  disconnect: vi.fn(),
  render: vi.fn(),
  removeLogin: vi.fn(),
  removeSave: vi.fn(),
  removeGenerator: vi.fn(),
  removeItem: vi.fn(),
  stopRecording: vi.fn(),
  saveEvents: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('./connectTRPC', () => ({
  trpc: {
    getContentScriptInitialState: { query: mocks.query },
    saveCapturedInputEvents: { mutate: mocks.saveEvents }
  }
}))
vi.mock('./totpAccountEmail', () => ({ initializeTotpAccountEmail: vi.fn() }))
vi.mock('./notyf', () => ({ notyf: { error: vi.fn(), success: vi.fn() } }))
vi.mock('./autofill', () => ({
  autofill: vi.fn(() => mocks.stopAutofill),
  autofillEventsDispatched: new Set(),
  filledElements: new Set(),
  inputTypesFilledForThisPage: new Set(),
  autofillValueIntoInput: vi.fn(),
  debouncedAutofill: Object.assign(vi.fn(), { cancel: vi.fn() })
}))
vi.mock('./domMutationObserver', () => ({
  bodyInputChangeEmitter: { on: vi.fn(), off: vi.fn() },
  startBodyInputChangeObserver: () => ({ disconnect: mocks.disconnect })
}))
vi.mock('./contentScriptRender', () => ({
  recordInputs: vi.fn(),
  contentScriptRender: mocks.render,
  showSavePromptIfAppropriate: vi.fn(),
  stopRecordingInputs: mocks.stopRecording
}))
vi.mock('./renderVerificationCodePicker', () => ({
  startVerificationCodePicker: () => mocks.stopPicker
}))
vi.mock('./renderLoginCredOption', () => ({
  removeLoginCredOption: mocks.removeLogin
}))
vi.mock('./renderSaveCredentialsForm', () => ({
  removeSaveCredentialsForm: mocks.removeSave
}))
vi.mock('./renderPasswordGenerator', () => ({
  removePasswordGenerator: mocks.removeGenerator
}))
vi.mock('./renderItemPopup', () => ({ removeItemPopup: mocks.removeItem }))

const snapshot = (): IInitStateRes => ({
  extensionDeviceReady: true,
  autofillEnabled: true,
  passwordCount: 1,
  webInputs: [],
  secretsForHost: { loginCredentials: [], totpSecrets: [] }
})
const receiveMessage = vi
  .mocked(browser.runtime.onMessage.addListener)
  .mock.calls.at(-1)![0]
const sender = { id: 'security-test-extension' }

beforeEach(async () => {
  await Promise.resolve()
  Object.defineProperty(browser.runtime, 'id', {
    value: sender.id,
    configurable: true
  })
  clearContentScriptVault()
  vi.clearAllMocks()
  mocks.query.mockResolvedValue(null)
  document.body.innerHTML = '<input id="password" type="password">'
})
afterEach(() => clearContentScriptVault())

describe('content script vault locking', () => {
  it('discards an initial-state response that arrives after locking', async () => {
    let resolve!: (value: IInitStateRes) => void
    mocks.query.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      })
    )
    const loading = refreshInputWatch()
    receiveMessage(vaultLockMessage, sender, vi.fn())
    resolve(snapshot())
    await loading
    expect(stateInitRes).toBeNull()
    expect(mocks.render).not.toHaveBeenCalled()
  })
  it('clears cached input and credential UI, then ignores form events after locking', async () => {
    mocks.query.mockResolvedValueOnce(snapshot())
    await refreshInputWatch()
    const input = document.getElementById('password') as HTMLInputElement
    domRecorder.addInputEvent({
      element: input,
      eventType: 'input',
      kind: WebInputType.PASSWORD,
      inputted: 'secret'
    })
    expect(stateInitRes).not.toBeNull()
    receiveMessage(vaultLockMessage, sender, vi.fn())
    expect(stateInitRes).toBeNull()
    expect(domRecorder.capturedInputEvents).toEqual([])
    expect(mocks.stopAutofill).toHaveBeenCalledOnce()
    expect(mocks.disconnect).toHaveBeenCalledOnce()
    for (const remove of [
      mocks.removeLogin,
      mocks.removeSave,
      mocks.removeGenerator,
      mocks.removeItem,
      mocks.stopRecording
    ])
      expect(remove).toHaveBeenCalled()
    input.value = 'new-secret'
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(domRecorder.capturedInputEvents).toEqual([])
    expect(mocks.saveEvents).not.toHaveBeenCalled()
  })
  it('accepts lock notifications only from this extension', async () => {
    mocks.query.mockResolvedValueOnce(snapshot())
    await refreshInputWatch()
    receiveMessage(vaultLockMessage, { id: 'another-extension' }, vi.fn())
    expect(stateInitRes).not.toBeNull()
    receiveMessage(vaultLockMessage, sender, vi.fn())
    expect(stateInitRes).toBeNull()
  })
  it('discards an initial response when the document enters the back-forward cache', async () => {
    let resolve!: (value: IInitStateRes) => void
    mocks.query.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      })
    )
    const loading = refreshInputWatch()
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true })
    )
    resolve(snapshot())
    await loading
    expect(stateInitRes).toBeNull()
    expect(mocks.render).not.toHaveBeenCalled()
  })
  it('rechecks a restored document instead of using credentials cached before a lock', async () => {
    mocks.query.mockResolvedValueOnce(snapshot())
    await refreshInputWatch()
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true })
    )
    expect(stateInitRes).toBeNull()
    expect(mocks.stopAutofill).toHaveBeenCalledOnce()
    mocks.render.mockClear()
    mocks.query.mockResolvedValueOnce(null)
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true })
    )
    await vi.waitFor(() => expect(mocks.query).toHaveBeenCalledTimes(2))
    expect(stateInitRes).toBeNull()
    expect(mocks.render).not.toHaveBeenCalled()
  })
  it('resumes autofill on restoration only after obtaining a fresh unlocked snapshot', async () => {
    mocks.query.mockResolvedValueOnce(snapshot())
    await refreshInputWatch()
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true })
    )
    mocks.render.mockClear()
    mocks.query.mockResolvedValueOnce(snapshot())
    window.dispatchEvent(
      new PageTransitionEvent('pageshow', { persisted: true })
    )
    await vi.waitFor(() => expect(mocks.render).toHaveBeenCalledOnce())
    expect(stateInitRes?.extensionDeviceReady).toBe(true)
  })
})
