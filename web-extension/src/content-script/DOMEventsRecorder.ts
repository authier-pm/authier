import { getCssSelector } from 'css-selector-generator'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { generateQuerySelectorForOrphanedElement } from './generateQuerySelectorForOrphanedElement'

export interface IInputRecord {
  element: HTMLInputElement | HTMLFormElement
  eventType: 'input' | 'submit' | 'keydown'
  kind: WebInputType | null
  inputted?: string
}

const defaultSelectorBlacklist = ['[data-*']

function getSelectorForElement(target: HTMLElement) {
  let selector
  if (document.body.contains(target)) {
    selector = getCssSelector(target, {
      blacklist: defaultSelectorBlacklist
    })

    if (selector.match(/\d+/)) {
      selector = getCssSelector(target, {
        blacklist: [selector, ...defaultSelectorBlacklist]
      })
    }
  } else {
    // this input is not in DOM anymore--it was probably removed as part of the login flow(multistep login flow)
    selector = generateQuerySelectorForOrphanedElement(target) // we fallback to generating selector from the orphaned element
  }

  return selector
}

export class DOMEventsRecorder {
  capturedInputEvents: IInputRecord[]
  constructor() {
    this.capturedInputEvents = []
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

  toJSON() {
    return this.capturedInputEvents.map(
      ({ element, eventType: type, inputted, kind }, i) => {
        const nextEvent = this.capturedInputEvents[i + 1]

        if (
          kind === null && // this can happen when the input for username is just a plain input with no attribute type="username"
          nextEvent &&
          nextEvent.kind === WebInputType.PASSWORD
        ) {
          kind = WebInputType.USERNAME_OR_EMAIL
        }
        return {
          element: getSelectorForElement(element),
          type,
          inputted,
          kind
        }
      }
    )
  }

  /**
   * if any email was inputted, we assume it's the username, if not we fallback to the input field just before the password
   */
  getUsername(): string | undefined {
    const emailInputs = this.capturedInputEvents.filter(
      ({ eventType: type, element }) => {
        return type === 'input' && element.type === 'email'
      }
    )
    if (emailInputs.length === 1) {
      return emailInputs[0].inputted
    }

    const inputEvents = this.capturedInputEvents.filter(
      ({ eventType: type, element }) => {
        return type === 'input' && element.type !== 'password'
      }
    )
    return inputEvents[inputEvents.length - 1]?.inputted
  }

  getPassword(): string | undefined {
    const inputEvents = this.capturedInputEvents.filter(
      ({ eventType: type, element }) => {
        return type === 'input' && element.type === 'password'
      }
    )
    return inputEvents[inputEvents.length - 1]?.inputted
  }
}
