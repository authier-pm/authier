export const site = {
  name: 'Authier',
  url: 'https://www.authier.pm',
  description:
    'An open-source password manager for credentials and TOTP codes, with client-side encryption and trusted-device approval.',
  githubUrl: 'https://github.com/authier-pm/authier',
  vaultUrl: 'https://vault.authier.pm',
  statusUrl: 'https://authier.openstatus.dev',
  discordUrl: 'https://discord.gg/PdGCMeXtFG',
  chromeUrl:
    'https://chromewebstore.google.com/detail/authier/padmmdghcflnaellmmckicifafoenfdi',
  firefoxUrl: 'https://addons.mozilla.org/en-US/firefox/addon/authier/',
  edgeUrl:
    'https://microsoftedge.microsoft.com/addons/detail/authier/jahkkkffomngonmmoopccjnhlngjjnll'
} as const

export const navigation = [
  { label: 'Features', href: '/features' },
  { label: 'Security', href: '/security' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' }
] as const
