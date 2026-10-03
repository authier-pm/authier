/** @jsxImportSource preact */
import { render } from 'preact'
import { PromptVerificationCode } from './components/PromptVerificationCode'
import { verificationCodeStyles } from './components/verificationCodeStyles'
import {
  findVerificationCodeTarget,
  getVerificationCodePosition,
  type VerificationCodeTarget
} from './verificationCodeTarget'

/** Track late-rendered OTP widgets and discard the picker when the page replaces them. */
export const startVerificationCodePicker = (dispatchedEvents: Set<Event>) => {
  const host = document.createElement('div')
  host.id = 'authier-verification-code-picker'
  const shadow = host.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  style.textContent = verificationCodeStyles
  const container = document.createElement('div')
  shadow.append(style, container)
  let target: VerificationCodeTarget | null = null
  let frameId: number | null = null

  const update = () => {
    frameId = null
    const next = findVerificationCodeTarget()
    if (!next) {
      render(null, container)
      host.remove()
      target = null
      return
    }
    if (
      target &&
      (target.segmented !== next.segmented ||
        target.inputs.length !== next.inputs.length ||
        target.inputs.some((input, index) => input !== next.inputs[index]))
    )
      render(null, container)
    target = next
    if (!host.isConnected) document.body.appendChild(host)
    render(
      <PromptVerificationCode
        target={target}
        position={getVerificationCodePosition(target)}
        dispatchedEvents={dispatchedEvents}
      />,
      container
    )
  }
  const schedule = () => {
    if (frameId === null) frameId = window.requestAnimationFrame(update)
  }
  const observer = new MutationObserver((records) => {
    if (records.every((record) => host.contains(record.target))) return
    schedule()
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      'class',
      'style',
      'hidden',
      'type',
      'disabled',
      'readonly',
      'maxlength',
      'inputmode',
      'autocomplete',
      'aria-label'
    ]
  })
  const resizeObserver = new ResizeObserver(schedule)
  resizeObserver.observe(document.body)
  window.addEventListener('resize', schedule)
  window.addEventListener('scroll', schedule, true)
  update()
  return () => {
    observer.disconnect()
    resizeObserver.disconnect()
    window.removeEventListener('resize', schedule)
    window.removeEventListener('scroll', schedule, true)
    if (frameId !== null) window.cancelAnimationFrame(frameId)
    render(null, container)
    host.remove()
  }
}
