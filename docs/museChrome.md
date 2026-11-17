# Use Authier with Muse in Chrome

Muse can use website sessions in the Chrome profile where its extension is
running. Authier can fill the login before you hand the site over to Muse.
[Meta's guide to browsing with Muse](https://www.meta.com/help/superintelligence/2124746764949121/)

1. Install Authier and [Muse from Meta](https://chromewebstore.google.com/detail/muse-from-meta/jnakhhjmpmoohbjgfccbccfoifnmbdjd)
   in the same desktop Chrome profile. Sign in to both extensions.
2. Open the website's sign-in page in a regular Chrome tab before starting
   the Muse task. Use Authier to fill the login and complete any other sign-in
   steps the site requires. Close the sign-in tab after the site accepts the login.
3. Lock the Authier vault. Open Muse's Chrome side panel and ask it to use
   the signed-in site in Chrome.

Muse can use other website sessions already signed in to that same profile.
Use a separate Chrome profile if you want to limit which sessions it can use.
Locking Authier protects the vault. To end a website session, sign out of
that website. [Meta's Chrome extension guidance](https://www.meta.com/help/superintelligence/2124746764949121/)

## Verification

The Playwright test runs the production Authier extension in a disposable
Chromium profile. It signs into a synthetic HTTPS site using a saved login,
locks Authier, and opens the protected page in a new tab. The site rejects
the initial visit and accepts the new tab's browser session cookie after
sign-in. The fixture keeps the cookie out of page JavaScript with HttpOnly.
The new tab stands in for the tab Muse would open.

Run these commands from the repository root after installing dependencies.

```sh
pnpm --dir web-extension exec playwright install chromium
API_URL=https://api.authier.test/graphql pnpm --dir web-extension prodBuild
pnpm --dir web-extension playwright:security autofillIsolation.spec.ts -g 'a new Chrome tab'
```

A live Muse check needs a signed-in Muse account. Use a test website account
and ask Muse to read a page behind sign-in after locking Authier.

## Native Muse sign-in

Muse's cloud browser uses a separate protected credential-fill service.
Meta's public Connector Platform describes API and MCP tools. The 1Password
integration has a partner-reviewed flow and runs its own extension inside
the hosted browser.
[Meta's connector guidelines](https://platform.muse.ai/docs) ·
[Meta's browser security design](https://muse.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse) ·
[1Password's security model](https://support.1password.com/1password-for-agents-security/)

A native Authier connector needs Meta's supported interface for requesting
and approving a login for a specific site, delivering it to the protected
browser, and handing control back after the fill. It also needs a Muse test
account with Authier enabled to verify that an approved sign-in succeeds and
that denying the request or changing sites prevents the fill.
