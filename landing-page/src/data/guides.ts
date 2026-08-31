export interface Guide {
  title: string
  description: string
  href: string
  updatedAt: string
  readingTime: string
  category: string
}

export const guides = [
  {
    title: 'Password Manager With Built-In 2FA',
    description:
      'Learn how a password manager with built-in TOTP works, when one vault is convenient, and when separating your second factor is the safer choice.',
    href: '/guides/password-manager-with-2fa',
    updatedAt: '2026-08-31',
    readingTime: '8 min read',
    category: 'Two-factor authentication'
  },
  {
    title: 'Trusted-Device Approval for Password Managers',
    description:
      'Understand how trusted-device approval changes new-device enrollment, what it can block, and which endpoint risks it cannot remove.',
    href: '/guides/trusted-device-approval',
    updatedAt: '2026-08-31',
    readingTime: '7 min read',
    category: 'Security model'
  },
  {
    title: 'How to Choose a Browser Password Manager',
    description:
      'Compare the security, autofill, platform, recovery, export, and audit questions that matter when choosing a browser password manager.',
    href: '/guides/browser-password-manager',
    updatedAt: '2026-08-31',
    readingTime: '9 min read',
    category: 'Buying guide'
  },
  {
    title: 'How to Import and Export a Password Vault',
    description:
      'Plan a safer password-manager migration with CSV and JSON exports, duplicate checks, verification steps, and secure cleanup of plaintext files.',
    href: '/guides/password-manager-import-export',
    updatedAt: '2026-08-31',
    readingTime: '8 min read',
    category: 'Migration guide'
  }
] as const satisfies readonly Guide[]
