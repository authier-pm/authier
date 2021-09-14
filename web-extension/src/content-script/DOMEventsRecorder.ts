import { getCssSelector } from 'css-selector-generator'

export interface IInputRecord {
  element: HTMLInputElement | HTMLFormElement
  type: 'input' | 'submit'
  inputted?: string
}

const defaultSelectorBlacklist = ['[data-*']

function getSelectorForElement(target: HTMLElement) {
  let selector = getCssSelector(target, {
    blacklist: defaultSelectorBlacklist
  })
  if (selector.match(/\d+/)) {
    selector = getCssSelector(target, {
      blacklist: [selector, ...defaultSelectorBlacklist]
    })
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
