import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { ICapturedInput } from '../background/backgroundPage'
import { getSelectorForElement } from './cssSelectorGenerators'

export interface IInputRecord {
  element: HTMLInputElement | HTMLFormElement
  eventType: 'input' | 'submit' | 'keydown'
  kind: WebInputType | null
  inputted?: string
}

const simpleEmailRegex = /\S+@\S+\.\S+/g

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
    return this.capturedInputEvents.map(
      ({ element, inputted, eventType: type, kind }, i) => {
        const nextEvent = this.capturedInputEvents[i + 1]

        if (
          kind === null && // this can happen when the input for username is just a plain input with no attribute type="username"
          nextEvent &&
          nextEvent.kind === WebInputType.PASSWORD
        ) {
          kind = WebInputType.USERNAME_OR_EMAIL
        }

        return {
          cssSelector: getSelectorForElement(element).css,
          domOrdinal: getSelectorForElement(element).domOrdinal,
          type,
          kind: kind as WebInputType,
          inputted
        }
      }
    )
  }

  /**
   * Returns the username based on the following priority:
   * 1. If user filled in any non-password input before the password, use that input's value
   * 2. If there's a single email on the page (and not from the current domain), use that
   * 3. Fallback to the last non-password input
   */
  getUsername(): string | undefined {
    // First check if user filled any non-password input
    const nonPasswordInputs = this.capturedInputEvents.filter(
      ({ eventType: type, element }) => {
        return type === 'input' && element.type !== 'password'
      }
    )

    // If user has filled any non-password input, use the last one
    if (nonPasswordInputs.length > 0) {
      return nonPasswordInputs[nonPasswordInputs.length - 1]?.inputted
    }

    // If no email input and no other inputs were filled, only then check for emails in the page text-this happens for example on google login page
    const matchedEmailsInText = document.body.innerText.match(simpleEmailRegex)
    if (matchedEmailsInText?.length === 1) {
      if (
        matchedEmailsInText[0].includes(
          location.hostname.replace('www.', '') // exclude emails from the same domain as we're currently on
        ) === false
      ) {
        return matchedEmailsInText[0] // the email is displayed on the page somewhere as regular text
      }
    }

    return undefined
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
