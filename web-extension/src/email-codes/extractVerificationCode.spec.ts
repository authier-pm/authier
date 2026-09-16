import { describe, expect, it } from 'vitest'
import { extractVerificationCode } from './extractVerificationCode'

describe('extractVerificationCode', () => {
  it.each([
    ['Your verification code is: 213456', '213456'],
    ['Your security code is 001234', '001234'],
    ['12345678 is your login code.', '12345678'],
    ['Your one-time password: A7B8C9D0', 'A7B8C9D0'],
    ['Your authentication code is ABCDEF', 'ABCDEF'],
    ['Your verification code: abcdefgh', 'abcdefgh'],
    ['Your security code: aBcDeFg', 'aBcDeFg'],
    ['Sign-in code: 123 456', '123456'],
    ['Security code: 1234-5678', '12345678'],
    ['Your sign-in code: ABC-123', 'ABC123'],
    ['Your sign-in code: AB CD EF', 'ABCDEF'],
    ['Your verification code: a b c d e f', 'abcdef'],
    ['Your verification code\nabcdef', 'abcdef'],
    ['Your verification code: 1\n2\n3\n4\n5\n6', '123456'],
    ['Your verification code: A 7 B 8 C 9 D 0', 'A7B8C9D0'],
    ['Your verification code: 21 · 34 · 56', '213456'],
    ['Your verification code: 1 2 3 4 5 6\n10 minutes until expiry.', '123456'],
    ['Use this code to sign in: 213456', '213456'],
    ['Your verification code: １２３４５６', '123456'],
    ['Your verification code: 123\u200b456', '123456'],
    ['Use 765432 to confirm your email.', '765432'],
    ['Your order number is 87654321. Your verification code: 213456.', '213456']
  ])('extracts %s', (text, code) => {
    expect(extractVerificationCode(text)).toBe(code)
  })

  it('uses an authentication subject for a standalone body code', () => {
    expect(
      extractVerificationCode(
        'Hi Alex. Enter 213456 to continue.',
        'Verify your email'
      )
    ).toBe('213456')
  })

  it('does not combine the word code with four digits to make an eight-character code', () => {
    expect(
      extractVerificationCode('Your code 1234', 'Your verification code')
    ).toBeNull()
    expect(
      extractVerificationCode('Your CODE 1234', 'Your verification code')
    ).toBeNull()
  })

  it('handles every whitespace partition of 6, 7 and 8 numeric characters', () => {
    for (const code of ['001234', '0123456', '12345678']) {
      for (let partition = 0; partition < 2 ** (code.length - 1); partition++) {
        const formatted = [...code]
          .map((character, index) => {
            const separator = (partition & (1 << index)) !== 0 ? '\n ' : ''
            return character + separator
          })
          .join('')
        expect(
          extractVerificationCode(
            `Your verification code:\n${formatted}\nExpires in 10 minutes.`
          ),
          formatted
        ).toBe(code)
      }
    }
  })

  it('does not append ordinary prose to a complete code', () => {
    expect(extractVerificationCode('Your verification code: 123456.')).toBe(
      '123456'
    )
    expect(
      extractVerificationCode(
        'Your verification code: 123456 Next step is login.'
      )
    ).toBe('123456')
  })

  it.each([
    'Your order number is 12345678.',
    'Discount code: SUMMER26',
    'Your verification code expires in 10 minutes.',
    'Your verification code should arrive soon.',
    'Your verification code\nArrives tomorrow.',
    'Your verification code: 12345',
    'Your verification code: 123456789',
    'Your verification code: a123456789z',
    'Your verification code: 1 2 3 4 5 6 7 8 9',
    'Your verification code: 123 456 789',
    'Your verification code: https://example.com/?code=123456',
    'Your invoice number is 213456. Sign in to view details.',
    'Discount code: SUMMER26. Sign in to redeem.',
    'Verification code: https://example.com/123456',
    'Verification code: user123456@example.com',
    'Your verification code will arrive soon. Call 12345678 for help.'
  ])('does not mistake unrelated text for a code: %s', (text) => {
    expect(extractVerificationCode(text)).toBeNull()
  })

  it('does not guess between equally close codes', () => {
    expect(
      extractVerificationCode('123456 verification code 654321')
    ).toBeNull()
  })
})
