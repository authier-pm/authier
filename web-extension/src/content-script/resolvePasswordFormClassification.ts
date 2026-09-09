import {
  cachedPasswordFormClassificationSchema,
  fingerprintPasswordForm,
  isValidPasswordFormResult,
  normalizePasswordFormUrl,
  type PasswordFormSnapshot
} from '@shared/passwordFormClassification'
import type { WebInputsArrayClientSide } from '../background/WebInputForAutofill'
import { snapshotPasswordForm } from './snapshotPasswordForm'
import { trpc } from './connectTRPC'
import {
  isCurrentPasswordInput,
  isNewPasswordInput,
  PasswordFormKind,
  type PasswordFormClassification
} from './classifyPasswordForm'

// Coalesce DOM mutation scans and remember failures until the page is reloaded.
const requests = new Map<string, Promise<unknown>>()

/** Clear the page-level request cache when resetting the test document. */
export const resetPasswordFormClassificationRequests = () => requests.clear()

const requestClassification = (
  fingerprint: string,
  snapshot: PasswordFormSnapshot
) => {
  let request = requests.get(fingerprint)
  if (!request) {
    request = trpc.classifyPasswordForm
      .mutate(snapshot)
      .catch((error: unknown) => {
        // A classification service failure must not break the existing overlay.
        console.warn('Authier could not classify this password form', error)
        return null
      })
    requests.set(fingerprint, request)
  }
  return request
}

export const resolvePasswordFormClassification = async (
  local: PasswordFormClassification,
  webInputs: WebInputsArrayClientSide
): Promise<PasswordFormClassification> => {
  if (local.confidence === 'high') return local
  const captured = snapshotPasswordForm(local.scope)
  if (!captured) return local
  const { snapshot, inputs } = captured
  const fingerprint = await fingerprintPasswordForm(snapshot)
  const cached = webInputs.find((input) => {
    if (normalizePasswordFormUrl(input.url) !== snapshot.url) return false
    const result = cachedPasswordFormClassificationSchema.safeParse(
      input.formClassification
    )
    return result.success && result.data.fingerprint === fingerprint
  })
  const response =
    cached?.formClassification ??
    (await requestClassification(fingerprint, snapshot))
  const classification =
    cachedPasswordFormClassificationSchema.safeParse(response)
  if (
    !classification.success ||
    classification.data.fingerprint !== fingerprint ||
    !isValidPasswordFormResult(classification.data.result, snapshot.inputs)
  )
    return local

  // The page may have navigated or replaced this form while the model was thinking.
  const staleClassification = {
    ...local,
    kind: PasswordFormKind.UNKNOWN,
    currentPasswordInput: null,
    newPasswordInputs: [],
    usernameInput: null
  }
  if (
    !local.scope.isConnected ||
    inputs.some((input) => !input.isConnected) ||
    normalizePasswordFormUrl(location.href) !== snapshot.url
  )
    return staleClassification
  const live = snapshotPasswordForm(local.scope)
  if (!live || (await fingerprintPasswordForm(live.snapshot)) !== fingerprint)
    return staleClassification

  const { result } = classification.data
  const newPasswordInputs = result.newPasswordIndexes.map(
    (index) => inputs[index]
  )
  const currentPasswordInput =
    result.currentPasswordIndex === null
      ? null
      : inputs[result.currentPasswordIndex]
  if (
    newPasswordInputs.some(isCurrentPasswordInput) ||
    (currentPasswordInput && isNewPasswordInput(currentPasswordInput))
  )
    return local

  return {
    kind: PasswordFormKind[result.kind],
    confidence: 'low',
    scope: local.scope,
    currentPasswordInput,
    newPasswordInputs,
    usernameInput:
      result.usernameIndex === null ? null : inputs[result.usernameIndex],
    signals: [
      'openrouter:classification',
      cached ? 'openrouter:cached' : 'openrouter:resolved'
    ]
  }
}
