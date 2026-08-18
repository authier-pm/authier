import { fireEvent } from '@testing-library/dom'
import { h, render } from 'preact'

const {
  fillGeneratedPasswordIntoInput,
  handleGeneratedPasswordAutofill,
  removePasswordGenerator
} = vi.hoisted(() => ({
  fillGeneratedPasswordIntoInput: vi.fn(),
  handleGeneratedPasswordAutofill: vi.fn().mockResolvedValue(undefined),
  removePasswordGenerator: vi.fn()
}))

vi.mock('../autofill', () => ({
  fillGeneratedPasswordIntoInput,
  generatePasswordBasedOnUserConfig: () => 'generated-password',
  handleGeneratedPasswordAutofill,
  resolveLiveGeneratedPasswordInput: (input: HTMLInputElement) => input
}))

vi.mock('../renderPasswordGenerator', () => ({
  removePasswordGenerator
}))

import { PromptPasswordGenerator } from './PromptPasswordGenerator'

const inputRect: DOMRect = {
  bottom: 140,
  height: 40,
  left: 100,
  right: 500,
  top: 100,
  width: 400,
  x: 100,
  y: 100,
  toJSON: () => ({})
}

const getButton = (container: HTMLElement, label: string) => {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent === label
  )
  if (!button) {
    throw new Error(`Could not find the ${label} button`)
  }
  return button
}

describe('PromptPasswordGenerator', () => {
  let container: HTMLDivElement
  let passwordInput: HTMLInputElement

  beforeEach(() => {
    container = document.createElement('div')
    passwordInput = document.createElement('input')
    passwordInput.type = 'password'
    passwordInput.getBoundingClientRect = () => inputRect
    document.body.replaceChildren(passwordInput, container)
    fillGeneratedPasswordIntoInput.mockReset()
    handleGeneratedPasswordAutofill.mockClear()
    removePasswordGenerator.mockClear()

    render(h(PromptPasswordGenerator, { input: passwordInput }), container)
  })

  afterEach(() => {
    render(null, container)
  })

  it('uses the Fill copy', () => {
    expect(container.textContent).toContain('Fill')
    expect(container.textContent).not.toContain('Use')
  })

  it('keeps the generator open when filling fails', async () => {
    fillGeneratedPasswordIntoInput.mockResolvedValue(null)

    fireEvent.click(getButton(container, 'Fill'))

    await vi.waitFor(() => {
      expect(container.textContent).toContain(
        'Could not fill this password field. Please try again.'
      )
    })
    expect(handleGeneratedPasswordAutofill).not.toHaveBeenCalled()
    expect(removePasswordGenerator).not.toHaveBeenCalled()
  })

  it('captures and closes only after a verified fill', async () => {
    fillGeneratedPasswordIntoInput.mockResolvedValue(passwordInput)

    fireEvent.click(getButton(container, 'Fill'))

    await vi.waitFor(() => {
      expect(handleGeneratedPasswordAutofill).toHaveBeenCalledWith(
        'generated-password',
        {
          passwordInput,
          showSavePrompt: true
        }
      )
    })
    expect(removePasswordGenerator).toHaveBeenCalledTimes(1)
  })
})
