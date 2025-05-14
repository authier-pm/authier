import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'

// this entire file is just for testing in a browser console

const uselessInputTypes = [
  'hidden',
  'submit',
  'button',
  'reset',
  'button',
  'checkbox',
  'radio',
  'file',
  'color',
  'image',
  'range',
  'search',
  'time'
]

export const getAllInputsIncludingShadowDom = (
  root: Element | Document | ShadowRoot
) => {
  const inputs: HTMLInputElement[] = []

  const searchNode = (node: Element | Document | ShadowRoot) => {
    const regularInputs = Array.from(
      node.querySelectorAll('input')
    ) as HTMLInputElement[]
    inputs.push(...regularInputs)

    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT,
      null
    )

    let currentNode = walker.currentNode
    while (currentNode) {
      let shadowRoot = (currentNode as Element).shadowRoot
      if (shadowRoot) {
        // console.log('currentNode11', currentNode)
        searchNode(shadowRoot)
      }
      const next = walker.nextNode()
      if (!next) break
      currentNode = next
    }
  }

  searchNode(root)
  return inputs
}

export const filterUselessInputs = (documentBody) => {
  const inputEls = getAllInputsIncludingShadowDom(documentBody)
  const inputElsArray = inputEls.filter((el) => {
    return (
      uselessInputTypes.includes(el.type) === false &&
      el.offsetWidth > 0 && // filter out hidden elements
      el.offsetHeight > 0 &&
      el.value === '' // filter out elements that already have a value
    )
  })
  return inputElsArray
}

/**
 * used for autofill in main world script context. It is needed to autofill inputs hidden in shadow DOM as content script cannot access them at all
 * for example reddit.com
 */
export function mainWorldAutofillFunction(
  loginCredentials: {
    username: string
    password: string
    lastUsedAt: string | null
  }[]
) {
  function isElementInViewport(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect()

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight ||
          document.documentElement.clientHeight) /* or $(window).height() */ &&
      rect.right <=
        (window.innerWidth ||
          document.documentElement.clientWidth) /* or $(window).width() */
    )
  }

  function isHidden(el) {
    const style = window.getComputedStyle(el)
    return style.display === 'none'
  }

  function imitateKeyInput(el: HTMLInputElement, input: string) {
    if (el) {
      if (el.value === input) {
        return
      }

      if (el.value !== '') {
        el.value = '' // reset if there is already some value
      }
      const dispatchAutofillEvent = (ev) => {
        el.dispatchEvent(ev)
      }
      // dispatch focus event

      for (let i = 0; i < input.length; i++) {
        const key = input[i]
        const keyboardEventInit = {
          bubbles: false,
          cancelable: false,
          composed: false,

          key: key,
          keyCode: key.charCodeAt(0),
          location: 0
        }
        const keyDown = new KeyboardEvent('keydown', keyboardEventInit)

        dispatchAutofillEvent(keyDown)

        const keyPress = new KeyboardEvent('keypress', keyboardEventInit)

        dispatchAutofillEvent(keyPress)

        const keyUp = new KeyboardEvent('keyup', keyboardEventInit)

        dispatchAutofillEvent(keyUp)
        el.value += key

        const change = new Event('change', { bubbles: true })

        dispatchAutofillEvent(change)
        // await sleep(2) // this is to make it a bit more realistic
      }

      const inputEvent = new Event('input', { bubbles: true })
      dispatchAutofillEvent(inputEvent)

      const blurEvent = new Event('blur', { bubbles: true }) // this is needed, because some websites actually trigger form validation on blur. for example coinmate.io
      dispatchAutofillEvent(blurEvent)
    } else {
      console.error('el is null')
    }
  }

  const filledElements = new Set<HTMLInputElement>()
  const autofillValueIntoInput = (element: HTMLInputElement, value: string) => {
    if (filledElements.has(element)) {
      return null
    }
    if (element.childNodes.length > 0) {
      //we should again loop through the children of the element and find the right input
      //@ts-ignore
      imitateKeyInput(element.childNodes[0], value)
      filledElements.add(element)
    }

    if (isElementInViewport(element) === false || isHidden(element)) {
      return null // could be dangerous to autofill into a hidden element-if the website got hacked, someone could be using this: https://websecurity.dev/password-managers/autofill/
    }

    element.style.backgroundColor = '#25DAC2'

    imitateKeyInput(element, value)
    filledElements.add(element)

    return element
  }

  const uselessInputTypes = [
    'hidden',
    'submit',
    'button',
    'reset',
    'button',
    'checkbox',
    'radio',
    'file',
    'color',
    'image',
    'range',
    'search',
    'time'
  ]

  function getAllInputsIncludingShadowDom(
    root: Element | Document | ShadowRoot
  ) {
    const inputs: HTMLInputElement[] = []

    const searchNode = (node: Element | Document | ShadowRoot) => {
      const regularInputs = Array.from(
        node.querySelectorAll('input')
      ) as HTMLInputElement[]
      inputs.push(...regularInputs)

      const elements = node.querySelectorAll('*')
      elements.forEach((element) => {
        if (element.shadowRoot) {
          searchNode(element.shadowRoot)
        }
      })
    }

    searchNode(root)
    return inputs
  }

  function filterUselessInputs(documentBody: Document | Element) {
    const inputEls = getAllInputsIncludingShadowDom(documentBody)
    const inputElsArray = inputEls.filter((el) => {
      return (
        !uselessInputTypes.includes(el.type) &&
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        el.value === ''
      )
    })
    return inputElsArray
  }

  const inputs = filterUselessInputs(document.body)

  const autofilledInputs: Array<{
    webInputType: WebInputType | null
    username: string | null
  }> = []

  if (loginCredentials.length === 0) {
    return []
  }

  const recentlyUsedLogin = loginCredentials.sort((a, b) => {
    return (a.lastUsedAt ?? '') > (b.lastUsedAt ?? '') ? -1 : 1
  })[0]

  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index]

    if (
      input.autocomplete?.includes('username') ||
      input.autocomplete?.includes('email')
    ) {
      const autofilledElUsername = autofillValueIntoInput(
        input,
        recentlyUsedLogin.username
      )
      autofilledInputs.push({
        webInputType: WebInputType.USERNAME,
        username: recentlyUsedLogin.username
      })
    } else if (input.type === 'password') {
      const autofilledElPassword = autofillValueIntoInput(
        input,
        recentlyUsedLogin.password
      )
      autofilledInputs.push({
        webInputType: WebInputType.PASSWORD,
        username: recentlyUsedLogin.username
      })
    }
  }

  return autofilledInputs
}
