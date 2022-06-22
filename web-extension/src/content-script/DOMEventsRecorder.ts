import browser from 'webextension-polyfill'

import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { generateQuerySelectorForOrphanedElement } from './generateQuerySelectorForOrphanedElement'
import { BackgroundMessageType } from '../background/BackgroundMessageType'

export interface IInputRecord {
  element: HTMLInputElement | HTMLFormElement
  eventType: 'input' | 'submit' | 'keydown'
  kind: WebInputType | null
  inputted?: string
}

interface ICSSSelectorDomOrdinal {
  css: string
  ordinal: number
}

export function getCssSelectorForInput(
  input: HTMLInputElement
): ICSSSelectorDomOrdinal {
  if (input.id) {
    return { css: `input#${input.id}`, ordinal: 0 }
  }
  let proposedSelector = ''
  if (input.name) {
    proposedSelector += `[name=${input.name}]`
  } else if (input.className) {
    proposedSelector += `[class=${input.name}]`
  } else if (input.autocomplete) {
    proposedSelector += `[autocomplete=${input.name}]`
  }

  const inputsForProposedSelector = document.querySelectorAll(proposedSelector)
  if (inputsForProposedSelector.length === 0) {
    return { css: proposedSelector, ordinal: 0 }
  } else {
    for (let index = 0; index < inputsForProposedSelector.length; index++) {
      const element = inputsForProposedSelector[index]
      if (element === input) {
        return { css: proposedSelector, ordinal: index }
      }
    }
    throw new Error('failed to resolve a CSS selector')
  }
}

export function getSelectorForElement(
  target: HTMLInputElement
): ICSSSelectorDomOrdinal {
  let selector: ICSSSelectorDomOrdinal
  if (document.body.contains(target)) {
    if (target.autocomplete && target.autocomplete !== 'off') {
      const autocompleteSelector = `[autocomplete="${target.autocomplete}"]`
      if (document.body.querySelectorAll(autocompleteSelector).length === 1) {
        return { css: autocompleteSelector, ordinal: 0 } // if the input has autocomplete, we always honor that. There are websites that generate ids for elements randomly
      }
    }

    selector = getCssSelectorForInput(target)
  } else {
    // this input is not in DOM anymore--it was probably removed as part of the login flow(multi step login flow)
    selector = {
      css: generateQuerySelectorForOrphanedElement(target),
      ordinal: 0
    } // we fallback to generating selector from the orphaned element
  }

  return selector
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
          element: getSelectorForElement(element as HTMLInputElement),
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

    const matchedEmailsInText = document.body.innerText.match(simpleEmailRegex)
    if (matchedEmailsInText?.length === 1) {
      if (
        matchedEmailsInText[0].includes(
          location.hostname.replace('www.', '') // exclude emails from the same domain as we're currently on
        ) === false
      ) {
        return matchedEmailsInText[0] // the email is displayed on the page somewhere as regular text(it was probably entered somewhere else)
      }
    }

    const inputEvents = this.capturedInputEvents.filter(
      ({ eventType: type, element }) => {
        return type === 'input' && element.type !== 'password'
      }
    )

    const previouslyInputted = inputEvents[inputEvents.length - 1]?.inputted

    return previouslyInputted
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
