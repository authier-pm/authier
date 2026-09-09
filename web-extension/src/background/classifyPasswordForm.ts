import { apolloClient } from '@src/apollo/apolloClient'
import {
  cachedPasswordFormClassificationSchema,
  fingerprintPasswordForm,
  normalizePasswordFormUrl,
  type PasswordFormSnapshot
} from '@shared/passwordFormClassification'
import {
  ClassifyPasswordFormDocument,
  type ClassifyPasswordFormMutation,
  type ClassifyPasswordFormMutationVariables
} from './chromeRuntimeListener.codegen'
import { device } from './ExtensionDevice'

export const classifyPasswordForm = async (snapshot: PasswordFormSnapshot) => {
  const state = device.state
  if (!state) return null
  const fingerprint = await fingerprintPasswordForm(snapshot)
  const cached = state.webInputs.find((input) => {
    const classification = cachedPasswordFormClassificationSchema.safeParse(
      input.formClassification
    )
    return (
      normalizePasswordFormUrl(input.url) === snapshot.url &&
      classification.success &&
      classification.data.fingerprint === fingerprint
    )
  })
  if (cached) return cached.formClassification

  const { data } = await apolloClient.mutate<
    ClassifyPasswordFormMutation,
    ClassifyPasswordFormMutationVariables
  >({ mutation: ClassifyPasswordFormDocument, variables: { input: snapshot } })
  const webInput = data?.classifyPasswordForm
  if (!webInput) return null
  const classification = cachedPasswordFormClassificationSchema.parse(
    webInput.formClassification
  )
  if (classification.fingerprint !== fingerprint)
    throw new Error('Password form classification fingerprint mismatch')
  state.webInputs = [
    ...state.webInputs.filter((input) => input.id !== webInput.id),
    webInput
  ]
  await state.save()
  return classification
}
