import { beforeEach, describe, expect, it } from 'vitest'
import { mainWorldAutofillFunction } from './getAllInputsIncludingShadowDom'

const USERNAME = 'jiri@example.com'
const PASSWORD = 'stored-password-42'

const credentials = () => [
  {
    username: USERNAME,
    password: PASSWORD,
    lastUsedAt: '2026-09-01T00:00:00.000Z'
  }
]

const inputById = (id: string): HTMLInputElement => {
  const input = document.getElementById(id)
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Missing input: ${id}`)
  }
  return input
}

beforeEach(() => {
  document.body.innerHTML = ''

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 10
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 10
  })
  HTMLElement.prototype.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    top: 0,
    right: 10,
    bottom: 10,
    left: 0,
    toJSON: () => ({})
  })
})

describe('main-world autofill fallback', () => {
  it('fills an explicit username and current-password login', () => {
    document.body.innerHTML = `<form>
      <input id="user" autocomplete="username" />
      <input id="password" type="password" autocomplete="current-password" />
    </form>`

    mainWorldAutofillFunction(credentials())

    expect(inputById('user').value).toBe(USERNAME)
    expect(inputById('password').value).toBe(PASSWORD)
  })

  it('fills only the explicit current-password field when a decoy is present', () => {
    document.body.innerHTML = `<form>
      <input id="user" autocomplete="username" />
      <input id="decoy" type="password" autocomplete="off" />
      <input id="password" type="password" autocomplete="current-password" />
    </form>`

    mainWorldAutofillFunction(credentials())

    expect(inputById('decoy').value).toBe('')
    expect(inputById('password').value).toBe(PASSWORD)
  })

  it('abstains from signup fields', () => {
    document.body.innerHTML = `<form>
      <input id="user" autocomplete="username" />
      <input id="password" type="password" autocomplete="new-password" />
      <input id="confirmation" type="password" autocomplete="new-password" />
    </form>`

    expect(mainWorldAutofillFunction(credentials())).toEqual([])
    expect(inputById('user').value).toBe('')
    expect(inputById('password').value).toBe('')
    expect(inputById('confirmation').value).toBe('')
  })

  it('abstains from change-password forms', () => {
    document.body.innerHTML = `<form>
      <input id="old-password" type="password" autocomplete="current-password" />
      <input id="new-password" type="password" autocomplete="new-password" />
    </form>`

    expect(mainWorldAutofillFunction(credentials())).toEqual([])
    expect(inputById('old-password').value).toBe('')
    expect(inputById('new-password').value).toBe('')
  })

  it('abstains when a new-password field is hidden from fill candidates', () => {
    document.body.innerHTML = `<form>
      <input id="old-password" type="password" autocomplete="current-password" />
      <input id="new-password" type="password" autocomplete="new-password" />
    </form>`
    Object.defineProperty(inputById('new-password'), 'offsetWidth', {
      configurable: true,
      value: 0
    })

    expect(mainWorldAutofillFunction(credentials())).toEqual([])
    expect(inputById('old-password').value).toBe('')
    expect(inputById('new-password').value).toBe('')
  })

  it('abstains when a new-password field already has a value', () => {
    document.body.innerHTML = `<form>
      <input id="old-password" type="password" autocomplete="current-password" />
      <input id="new-password" type="password" autocomplete="new-password" value="existing-draft" />
    </form>`

    expect(mainWorldAutofillFunction(credentials())).toEqual([])
    expect(inputById('old-password').value).toBe('')
    expect(inputById('new-password').value).toBe('existing-draft')
  })

  it('abstains from ambiguous unannotated password fields', () => {
    document.body.innerHTML = `<form>
      <input id="first" type="password" />
      <input id="second" type="password" />
    </form>`

    expect(mainWorldAutofillFunction(credentials())).toEqual([])
    expect(inputById('first').value).toBe('')
    expect(inputById('second').value).toBe('')
  })

  it.each([
    ['the hidden attribute', 'hidden', ''],
    ['display none', 'style', 'display: none'],
    ['hidden visibility', 'style', 'visibility: hidden'],
    ['collapsed visibility', 'style', 'visibility: collapse'],
    ['zero opacity', 'style', 'opacity: 0']
  ])(
    'abstains from a current-password input concealed by %s',
    (_, name, value) => {
      document.body.innerHTML = `<form>
      <input id="password" type="password" autocomplete="current-password" />
    </form>`
      inputById('password').setAttribute(name, value)

      expect(mainWorldAutofillFunction(credentials())).toEqual([])
      expect(inputById('password').value).toBe('')
    }
  )

  it.each(['disabled', 'readonly'])(
    'abstains from an ineligible %s current-password input',
    (attribute) => {
      document.body.innerHTML = `<form>
        <input id="password" type="password" autocomplete="current-password" ${attribute} />
      </form>`

      expect(mainWorldAutofillFunction(credentials())).toEqual([])
      expect(inputById('password').value).toBe('')
    }
  )

  it('still fills an explicit username-only login step', () => {
    document.body.innerHTML = `<form>
      <input id="user" autocomplete="username" />
    </form>`

    mainWorldAutofillFunction(credentials())

    expect(inputById('user').value).toBe(USERNAME)
  })

  it('runs from its serialized body without module closures', () => {
    document.body.innerHTML = `<form>
      <input id="user" autocomplete="username" />
      <input id="password" type="password" autocomplete="current-password" />
    </form>`
    const serializedFunction = mainWorldAutofillFunction.toString()
    const executeSerialized: typeof mainWorldAutofillFunction = window.eval(
      `(${serializedFunction})`
    )

    executeSerialized(credentials())

    expect(serializedFunction).not.toContain('WebInputType')
    expect(inputById('user').value).toBe(USERNAME)
    expect(inputById('password').value).toBe(PASSWORD)
  })
})
