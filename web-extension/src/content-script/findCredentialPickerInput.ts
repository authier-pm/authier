import type { WebInputsArrayClientSide } from '../background/WebInputForAutofill'
import { WebInputType } from '@shared/generated/graphqlBaseTypes'
import { isPlausibleUsernameInput } from './classifyPasswordForm'
import { isLikelyOtpField } from './findOtpInputs'
import { isElementVisibleInViewport } from './isElementInViewport'

/** A learned CSS path is only a hint; a later login step can reuse it for 2FA. */
export const findCredentialPickerInput = (
  webInputs: WebInputsArrayClientSide
): HTMLInputElement | null => {
  for (const webInput of webInputs) {
    // Model records are usable only after the live form fingerprint is checked.
    if (webInput.formClassification) continue
    if (
      ![
        WebInputType.USERNAME,
        WebInputType.USERNAME_OR_EMAIL,
        WebInputType.EMAIL,
        WebInputType.PASSWORD
      ].includes(webInput.kind)
    )
      continue

    const input = document.querySelectorAll(webInput.domPath)[
      webInput.domOrdinal
    ]
    if (
      !(input instanceof HTMLInputElement) ||
      input.disabled ||
      input.readOnly ||
      isLikelyOtpField(input) ||
      !isElementVisibleInViewport(input)
    )
      continue

    const isMatchingKind =
      webInput.kind === WebInputType.PASSWORD
        ? input.type === 'password'
        : isPlausibleUsernameInput(input)
    if (isMatchingKind) return input
  }
  return null
}
