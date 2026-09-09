import {
  findSegmentedOtpInputs,
  findSingleOtpInput,
  pickWholeCodeEntryBox
} from './findOtpInputs'
import { isElementVisibleInViewport } from './isElementInViewport'
import { wait } from './wait'

/** Write once: synthetic keystrokes also reach document-level OTP handlers. */
const writeOtpValue = (
  input: HTMLInputElement,
  value: string,
  dispatchedEvents: Set<Event>
) => {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set
  if (!setter || !isElementVisibleInViewport(input)) {
    return
  }

  input.focus()
  setter.call(input, value)
  for (const event of [
    new InputEvent('input', {
      bubbles: true,
      composed: true,
      data: value,
      inputType: 'insertReplacementText'
    }),
    new Event('change', { bubbles: true })
  ]) {
    dispatchedEvents.add(event)
    input.dispatchEvent(event)
  }
}

const pasteOtpCode = (
  input: HTMLInputElement,
  code: string,
  dispatchedEvents: Set<Event>
) => {
  if (
    typeof DataTransfer === 'undefined' ||
    typeof ClipboardEvent === 'undefined'
  ) {
    return false
  }

  const clipboardData = new DataTransfer()
  clipboardData.setData('text/plain', code)
  const event = new ClipboardEvent('paste', {
    clipboardData,
    bubbles: true,
    cancelable: true,
    composed: true
  })
  input.focus()
  dispatchedEvents.add(event)
  input.dispatchEvent(event)
  return event.defaultPrevented
}

/** Returns only inputs verified to contain the exact code after the page renders. */
export const fillOtpInputs = async (
  inputs: HTMLInputElement[],
  code: string,
  dispatchedEvents: Set<Event>,
  knownInput?: HTMLInputElement
): Promise<HTMLInputElement[] | null> => {
  const segmented = findSegmentedOtpInputs(inputs, code.length)
  if (!segmented) {
    const input = findSingleOtpInput(inputs, code.length)?.input ?? knownInput
    if (
      !input ||
      !inputs.includes(input) ||
      !['text', 'tel', 'number'].includes(input.type) ||
      input.disabled ||
      input.readOnly ||
      (input.maxLength !== -1 && input.maxLength < code.length)
    )
      return null
    writeOtpValue(input, code, dispatchedEvents)
    await wait(50)
    return input.isConnected && input.value === code ? [input] : null
  }

  const boxes = segmented.inputs
  if (!boxes.every(isElementVisibleInViewport)) return null
  const hasExactCode = () =>
    boxes.every((box, index) => box.isConnected && box.value === code[index])

  const entryBox = pickWholeCodeEntryBox(boxes, code.length)
  if (entryBox) {
    writeOtpValue(entryBox, code, dispatchedEvents)
    await wait(50)
    if (hasExactCode()) return boxes
  }

  // Bitfinex consumes paste on document and updates controlled boxes later.
  // Yield a task, not just a microtask, before considering a fallback. If the
  // page consumed the paste, never send a second input sequence into its state.
  const pasteHandled = pasteOtpCode(boxes[0], code, dispatchedEvents)
  await wait(50)
  if (hasExactCode()) return boxes
  if (pasteHandled) return null

  for (const [index, box] of boxes.entries()) {
    writeOtpValue(box, code[index], dispatchedEvents)
    await wait(0)
  }
  await wait(50)
  return hasExactCode() ? boxes : null
}
