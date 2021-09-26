import { getCssSelector } from 'css-selector-generator'
import { generateQuerySelectorForOrphanedElement } from './generateQuerySelectorForOrphanedElement'

export interface IInputRecord {
  element: HTMLInputElement | HTMLFormElement
  type: 'input' | 'submit' | 'keydown'
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
    return this.capturedInputEvents.map(({ element, type, inputted }) => {
      return {
        element: getSelectorForElement(element),
        type,
        inputted
      }
    })
  }

  getUsername(): string | undefined {
    const inputEvents = this.capturedInputEvents.filter(({ type, element }) => {
      return type === 'input' && element.type !== 'password'
    })
    return inputEvents[inputEvents.length - 1]?.inputted
  }

  getPassword(): string | undefined {
    const inputEvents = this.capturedInputEvents.filter(({ type, element }) => {
      return type === 'input' && element.type === 'password'
    })
    return inputEvents[inputEvents.length - 1]?.inputted
  }
}
