import { generateQuerySelectorForOrphanedElement } from './cssSelectorGenerators'

describe('generateQuerySelectorForOrphanedElement', () => {
  it('should generate selector with className when available', () => {
    const res = generateQuerySelectorForOrphanedElement({
      tagName: 'INPUT',
      type: 'text',
      className: 'email-input form-control',
      autocomplete: 'email'
    } as any)

    expect(res).toEqual(
      'INPUT[class="email-input form-control"][type="text"][autocomplete="email"]'
    )
  })

  it('should generate selector with name when available', () => {
    const res = generateQuerySelectorForOrphanedElement({
      tagName: 'INPUT',
      type: 'password',
      name: 'userPassword',
      autocomplete: 'current-password'
    } as any)

    expect(res).toEqual(
      'INPUT[name="userPassword"][type="password"][autocomplete="current-password"]'
    )
  })

  it('should generate selector with name and className when both available', () => {
    const res = generateQuerySelectorForOrphanedElement({
      tagName: 'INPUT',
      type: 'text',
      name: 'username',
      className: 'login-field',
      autocomplete: 'username'
    } as any)

    expect(res).toEqual(
      'INPUT[name="username"][class="login-field"][type="text"][autocomplete="username"]'
    )
  })

  it('should use fallback attributes when no className or name', () => {
    const res = generateQuerySelectorForOrphanedElement({
      tagName: 'INPUT',
      type: 'text',
      placeholder: 'Enter your email',
      title: 'Email address',
      autocomplete: 'email'
    } as any)

    expect(res).toEqual(
      'INPUT[type="text"][autocomplete="email"][placeholder="Enter your email"][title="Email address"]'
    )
  })

  it('should generate basic selector with type and autocomplete when minimal attributes', () => {
    const res = generateQuerySelectorForOrphanedElement({
      tagName: 'INPUT',
      type: 'text',
      autocomplete: 'email'
    } as any)

    expect(res).toEqual('INPUT[type="text"][autocomplete="email"]')
  })
})
