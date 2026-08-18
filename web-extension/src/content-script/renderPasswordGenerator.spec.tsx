vi.mock('./components/PromptPasswordGenerator', () => ({
  PromptPasswordGenerator: () => null
}))

import {
  removePasswordGenerator,
  renderPasswordGenerator
} from './renderPasswordGenerator'

describe('renderPasswordGenerator', () => {
  afterEach(() => {
    removePasswordGenerator()
    vi.restoreAllMocks()
  })

  it('isolates the generator styles from the host page', () => {
    const nativeAttachShadow = HTMLElement.prototype.attachShadow
    let generatorShadow: ShadowRoot | null = null
    const attachShadow = vi
      .spyOn(HTMLElement.prototype, 'attachShadow')
      .mockImplementation(function (options) {
        expect(options.mode).toBe('closed')
        generatorShadow = nativeAttachShadow.call(this, { mode: 'open' })
        return generatorShadow
      })
    const input = document.createElement('input')
    input.type = 'password'
    document.body.appendChild(input)

    renderPasswordGenerator({ input })

    expect(attachShadow).toHaveBeenCalledTimes(1)
    expect(generatorShadow?.querySelector('style')?.textContent).toContain(
      '.authier-generator__trigger'
    )
    expect(document.getElementById('authier-password-generator')).not.toBeNull()
  })
})
