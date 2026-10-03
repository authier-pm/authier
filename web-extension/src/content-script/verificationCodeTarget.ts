import { findSegmentedOtpInputs, findSingleOtpInput } from './findOtpInputs'
import { getAllInputsIncludingShadowDom } from './getAllInputsIncludingShadowDom'
import { isElementVisibleInViewport } from './isElementInViewport'
import type { VerificationCodeSuggestion } from '../verification-codes/verificationCodeProtocol'

export type VerificationCodeTarget = {
  inputs: HTMLInputElement[]
  segmented: boolean
}

export const findVerificationCodeTarget = (): VerificationCodeTarget | null => {
  // Include partially completed fields so choosing a code replaces every digit.
  const visible = getAllInputsIncludingShadowDom(document.body).filter(
    isElementVisibleInViewport
  )
  const segmented = findSegmentedOtpInputs(visible)
  if (segmented) return { inputs: segmented.inputs, segmented: true }
  const single = findSingleOtpInput(visible, 4)
  return single ? { inputs: [single.input], segmented: false } : null
}

export const suggestionFitsTarget = (
  entry: VerificationCodeSuggestion,
  target: VerificationCodeTarget
) => {
  if (entry.expiresAt <= Date.now()) return false
  if (target.segmented && entry.codeLength !== target.inputs.length)
    return false
  if (
    !target.segmented &&
    target.inputs[0].maxLength !== -1 &&
    entry.codeLength > target.inputs[0].maxLength
  )
    return false
  const numeric = target.inputs.some(
    (input) => input.type === 'number' || input.inputMode === 'numeric'
  )
  return !numeric || entry.numeric
}

export type VerificationCodePosition = {
  left: number
  top: number
  panelLeft: number
  panelTop: number
}

const TRIGGER_SIZE = 32
const PANEL_WIDTH = 320
const PANEL_HEIGHT = 260
const INSET = 12

export const getVerificationCodePosition = (
  target: VerificationCodeTarget
): VerificationCodePosition => {
  const bounds = target.inputs.map((input) => input.getBoundingClientRect())
  const right = Math.max(...bounds.map((rect) => rect.right))
  const top = Math.min(...bounds.map((rect) => rect.top))
  const bottom = Math.max(...bounds.map((rect) => rect.bottom))
  const fitsBeside = right + 8 + TRIGGER_SIZE <= window.innerWidth - 8
  const left = fitsBeside ? right + 8 : right - TRIGGER_SIZE
  const triggerTop = fitsBeside
    ? top + (bottom - top - TRIGGER_SIZE) / 2
    : bottom + 8
  const below = Math.max(bottom, triggerTop + TRIGGER_SIZE) + 10
  const panelTop =
    below + PANEL_HEIGHT <= window.innerHeight
      ? below
      : Math.max(INSET, top - PANEL_HEIGHT - 10)
  return {
    left: Math.min(left, window.innerWidth - TRIGGER_SIZE - INSET),
    top: triggerTop,
    panelLeft: Math.max(
      INSET,
      Math.min(
        left + TRIGGER_SIZE - PANEL_WIDTH,
        window.innerWidth - PANEL_WIDTH - INSET
      )
    ),
    panelTop
  }
}
