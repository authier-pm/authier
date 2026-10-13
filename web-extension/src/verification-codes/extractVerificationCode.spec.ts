import { describe, expect, it } from 'vitest'
import smsVectors from '../../../shared/smsVerificationCodeVectors.json'
import {
  bazoomVerificationEmailBody,
  bazoomVerificationEmailSubject
} from '../../ui-preview/fixtures/bazoomVerificationEmail'
import {
  cloudflareEmailRoutingBody,
  cloudflareEmailRoutingSubject
} from '../../ui-preview/fixtures/cloudflareEmailRouting'
import {
  extractSmsVerificationCode,
  extractVerificationCode
} from './extractVerificationCode'

describe('extractVerificationCode', () => {
  it('detects the four-digit Bazoom code instead of its postal footer', () => {
    expect(
      extractVerificationCode(
        bazoomVerificationEmailBody,
        bazoomVerificationEmailSubject
      )
    ).toBe('2222')
  })

  it.each([
    ['Your verification code is: 2222', '2222'],
    ['Your security code is 01234', '01234'],
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
    ['Your sign-in code: 1234 AB', '1234AB'],
    ['Your sign-in code: 01234 ABC', '01234ABC'],
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

  it('does not turn the postal address in a link-only Cloudflare email into a code', () => {
    expect(
      extractVerificationCode(
        cloudflareEmailRoutingBody,
        cloudflareEmailRoutingSubject
      )
    ).toBeNull()
  })

  it.each(['© 2026', 'Copyright 2026'])(
    'ignores a footer year while still accepting the same digits as a code: %s',
    (footer) => {
      expect(extractVerificationCode(footer, 'Verify your email')).toBeNull()
      expect(
        extractVerificationCode(`Your verification code: 2026\n${footer}`)
      ).toBe('2026')
    }
  )

  it.each(['CA 94107', 'NY 10001', 'CA94107'])(
    'ignores a city/state/ZIP address near verification language: %s',
    (address) => {
      expect(
        extractVerificationCode(
          `Verify your email using the link above.\n101 Example Street, Example City, ${address}`,
          'Verify your email'
        )
      ).toBeNull()
    }
  )

  it('still accepts a real alphanumeric code that resembles a state and ZIP', () => {
    expect(extractVerificationCode('Your verification code: CA 94107')).toBe(
      'CA94107'
    )
    expect(extractVerificationCode('Your verification code: CA94107')).toBe(
      'CA94107'
    )
    expect(
      extractVerificationCode(
        'Your verification code: 213456.\n101 Townsend Street, San Francisco, CA 94107'
      )
    ).toBe('213456')
  })

  it('keeps the word code separate from a four-digit code', () => {
    expect(
      extractVerificationCode('Your code 1234', 'Your verification code')
    ).toBe('1234')
    expect(
      extractVerificationCode('Your CODE 1234', 'Your verification code')
    ).toBe('1234')
  })

  it('handles every whitespace partition of 4–8 numeric characters', () => {
    for (const code of ['0012', '01234', '001234', '0123456', '12345678']) {
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
    expect(
      extractVerificationCode(
        'Your verification code: 2222 Next step is login.'
      )
    ).toBe('2222')
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
    'Your verification code: 123',
    'Your verification code: ABCD',
    'Your verification code: A1234',
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

describe('extractSmsVerificationCode', () => {
  // The Kotlin SMS extractor is tested against the same vectors.
  it.each(smsVectors)('extracts $code from $text', ({ text, code }) => {
    expect(extractSmsVerificationCode(text)).toBe(code)
  })

  it('requires authentication context for email and keeps its letter-only and sender-prefix rules', () => {
    expect(extractVerificationCode('Your Uber code: 1234.')).toBeNull()
    expect(
      extractVerificationCode('Your Uber code: 1234.', 'Verify your email')
    ).toBe('1234')
    expect(extractVerificationCode('Your code: PLATBA', 'Sign in')).toBe(
      'PLATBA'
    )
    expect(
      extractVerificationCode('G-123456 is your Google verification code.')
    ).toBe('G123456')
  })
})
