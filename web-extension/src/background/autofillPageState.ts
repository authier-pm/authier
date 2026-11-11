import type {
  ICapturedInput,
  ISaveLoginModalState
} from './chromeRuntimeListener'

export const saveLoginModalsStates = new Map<string, ISaveLoginModalState>()
export const capturedInputsByDocument = new Map<string, ICapturedInput[]>()

export const clearAutofillPageState = () => {
  saveLoginModalsStates.clear()
  capturedInputsByDocument.clear()
}
