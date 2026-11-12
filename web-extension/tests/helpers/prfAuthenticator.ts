import type { BrowserContext, Page } from '@playwright/test'

/** Test authenticator state lives outside the profile being copied/scanned. */
export async function addPrfAuthenticator(
  context: BrowserContext,
  page: Page,
  supported = true
) {
  const client = await context.newCDPSession(page)
  await client.send('WebAuthn.enable')
  return client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      ctap2Version: 'ctap2_1',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
      hasPrf: supported
    }
  })
}
