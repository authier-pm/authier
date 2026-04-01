import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { ICapturedInput } from '../background/backgroundPage'
import { getSelectorForElement } from './cssSelectorGenerators'

export interface IInputRecord {
  element: HTMLInputElement | HTMLFormElement
  eventType: 'input' | 'submit' | 'keydown'
  kind: WebInputType | null
  inputted?: string
}

const simpleEmailRegex = /\S+@\S+\.\S+/
const simpleEmailGlobalRegex = /\S+@\S+\.\S+/g

type UsernameCandidate = Pick<IInputRecord, 'kind' | 'inputted'>

const normalizeInputtedValue = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const isLikelyEmail = (value?: string): value is string => {
  const normalizedValue = normalizeInputtedValue(value)
  return normalizedValue ? simpleEmailRegex.test(normalizedValue) : false
}

export const getUsernameFromCapturedInputs = (
  capturedInputEvents: UsernameCandidate[]
) => {
  const nonPasswordInputs = capturedInputEvents
    .filter(({ kind }) => kind !== WebInputType.PASSWORD)
    .map(({ inputted }) => normalizeInputtedValue(inputted))
    .filter((inputted): inputted is string => Boolean(inputted))

  const emailInput = [...nonPasswordInputs].reverse().find((inputted) =>
    isLikelyEmail(inputted)
  )

  if (emailInput) {
    return emailInput
  }

  return nonPasswordInputs[nonPasswordInputs.length - 1]
}

export const getSingleVisibleEmailFromPage = (
  pageText: string,
  hostname: string
) => {
  const currentHostname = hostname.replace('www.', '')
  const matchedEmailsInText = [
    ...new Set(pageText.match(simpleEmailGlobalRegex)?.map((item) => item.trim()))
  ].filter((email) => email.includes(currentHostname) === false)

  if (matchedEmailsInText.length === 1) {
    return matchedEmailsInText[0]
  }

  return undefined
}

export class DOMEventsRecorder {
  capturedInputEvents: IInputRecord[]
  constructor() {
    this.capturedInputEvents = []
  }

  hasInput(input: HTMLInputElement) {
    return this.capturedInputEvents.some(({ element }) => {
      return element === input
    })
  }

  addInputEvent(event: IInputRecord) {
    const existingEventIndex = this.capturedInputEvents.findIndex(
      ({ element }) => {
        return event.element === element
      }
    )
    if (existingEventIndex !== -1) {
      this.capturedInputEvents.splice(existingEventIndex, 1)
    }

    this.capturedInputEvents.push(event)

    if (this.capturedInputEvents.length > 10) {
      this.capturedInputEvents.shift() // we don't need more than 10 events
    }
  }

  toJSON(): ICapturedInput[] {
    const json = this.capturedInputEvents.map(
      ({ element, inputted, eventType: type, kind }, i) => {
        const nextEvent = this.capturedInputEvents[i + 1]

        if (kind === null) {
          const nextEventIsPassword = nextEvent?.kind === WebInputType.PASSWORD
          const eventType = nextEventIsPassword ? 'inferred-username' : 'unknown'
          console.warn(`Skipping ${eventType} web input`, element)
        }

        return {
          cssSelector: getSelectorForElement(element).css,
          domOrdinal: getSelectorForElement(element).domOrdinal,
          type,
          kind: kind,
          inputted
        }
      }
    )
    return json.filter(({ kind }) => kind !== null) as ICapturedInput[]
  }

  /**
   * Returns the username based on the following priority:
   * 1. If user filled in any non-password input before the password, use that input's value
   * 2. If there's a single email on the page (and not from the current domain), use that
   * 3. Fallback to the last non-password input
   */
  getUsername(): string | undefined {
    const usernameFromInputs = getUsernameFromCapturedInputs(
      this.capturedInputEvents.filter(({ eventType: type }) => type === 'input')
    )
    if (usernameFromInputs) {
      return usernameFromInputs
    }

    // If no email input and no other inputs were filled, only then check for emails in the page text-this happens for example on google login page
    return getSingleVisibleEmailFromPage(
      document.body.innerText,
      location.hostname
    )
  }

  getPassword(): string | undefined {
    const inputEvents = this.capturedInputEvents.filter(
      ({ eventType: type, element }) => {
        return type === 'input' && element.type === 'password'
      }
    )
    return inputEvents[inputEvents.length - 1]?.inputted
  }

  clearCapturedEvents() {
    this.capturedInputEvents = []
  }
}
