import {
  fingerprintPasswordForm,
  type PasswordFormSnapshot
} from '@shared/passwordFormClassification'
import type { ICapturedInput } from '@src/background/chromeRuntimeListener'

let capturedInputEvents: ICapturedInput[] = []
export const trpc = {
  getContentScriptInitialState: { query: async () => null },
  classifyPasswordForm: {
    mutate: async (snapshot: PasswordFormSnapshot) => {
      const fingerprint = await fingerprintPasswordForm(snapshot)
      const key = `preview-web-inputs:${fingerprint}`
      const cached: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
      if (cached) return cached
      const result = {
        version: 1,
        fingerprint,
        result: {
          kind: 'SIGNUP',
          currentPasswordIndex: null,
          newPasswordIndexes: [0, 1],
          usernameIndex: null
        }
      }
      localStorage.setItem(key, JSON.stringify(result))
      localStorage.setItem(
        'preview-classification-requests',
        String(
          Number(localStorage.getItem('preview-classification-requests') ?? 0) +
            1
        )
      )
      localStorage.setItem(
        'preview-classification-snapshot',
        JSON.stringify(snapshot)
      )
      return result
    }
  },
  saveCapturedInputEvents: {
    mutate: async (input: { inputEvents: ICapturedInput[] }) => {
      capturedInputEvents = input.inputEvents
    }
  },
  getCapturedInputEvents: {
    query: async () => ({ capturedInputEvents, inputsUrl: location.href })
  },
  saveLoginCredentialsModalShown: { mutate: async () => undefined },
  hideLoginCredentialsModal: { mutate: async () => undefined },
  getFallbackUsernames: { query: async () => [] }
}
