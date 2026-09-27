import {
  isCurrentPasswordInput,
  isNewPasswordInput
} from './classifyPasswordForm'
import { getAllInputsIncludingShadowDom } from './getAllInputsIncludingShadowDom'
import { isElementRendered } from './isElementInViewport'

const isPasswordLikeInput = (el: HTMLInputElement) =>
  el.type === 'password' || isNewPasswordInput(el)

const isFillableCompanion = (el: HTMLInputElement) =>
  isPasswordLikeInput(el) &&
  !el.disabled &&
  !el.readOnly &&
  !isCurrentPasswordInput(el) &&
  isElementRendered(el)

/** steps out of shadow roots too, so web component forms keep working */
const getParentAcrossShadowRoots = (el: Element): Element | null => {
  if (el.parentElement) {
    return el.parentElement
  }
  const root = el.getRootNode()
  return root instanceof ShadowRoot ? root.host : null
}

const getScopeInputs = (primary: HTMLInputElement): HTMLInputElement[] => {
  // form.elements includes inputs linked from outside via the form attribute
  if (primary.form) {
    return Array.from(primary.form.elements).filter(
      (el): el is HTMLInputElement => el instanceof HTMLInputElement
    )
  }

  // formless pages: the nearest ancestor that holds another password field,
  // skipping fields that belong to some unrelated <form>
  let ancestor = getParentAcrossShadowRoots(primary)
  while (ancestor) {
    const inputs = getAllInputsIncludingShadowDom(ancestor).filter(
      (el) => el.form === null
    )
    if (inputs.some((el) => el !== primary && isFillableCompanion(el))) {
      return inputs
    }
    ancestor = getParentAcrossShadowRoots(ancestor)
  }
  return []
}

/**
 * The fields that must receive the same generated password as `primary` -
 * typically the "repeat password" box of a signup or change-password form.
 * Confirmation fields always follow the new password, so a password field
 * before `primary` is only included when it is explicitly marked
 * `new-password`; that keeps the current password of a change-password form
 * untouched.
 */
export const findGeneratedPasswordCompanions = (
  primary: HTMLInputElement
): HTMLInputElement[] => {
  const scopeInputs = getScopeInputs(primary)
  const primaryIndex = scopeInputs.indexOf(primary)

  return scopeInputs.filter(
    (el, index) =>
      el !== primary &&
      isFillableCompanion(el) &&
      (index > primaryIndex || isNewPasswordInput(el))
  )
}
