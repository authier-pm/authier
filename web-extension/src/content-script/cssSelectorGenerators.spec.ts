import { generateQuerySelectorForOrphanedElement } from './cssSelectorGenerators'

describe('generateQuerySelectorForOrphanedElement', () => {
  it('should generate selector based on type and autocomplete attributes', () => {
    const res = generateQuerySelectorForOrphanedElement({
      tagName: 'INPUT',
      type: 'text',
      autocomplete: 'email'
    } as any)

    expect(res).toEqual('INPUT[type="text"][autocomplete="email"]')
  })
})
