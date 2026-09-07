# Passkeys in Authier

Authier can create and use website passkeys in its encrypted vault. Sign in to
Authier on another supported browser, approve that Authier device as usual, and
sync the vault to use the same website credentials there.

## Using passkeys

1. Install the updated extension and sign in to Authier.
2. Open a website's security settings and choose to add a passkey.
3. In the separate Authier window, check the website address, enter your master
   password, and select **Save passkey**.
4. On the website's next passkey sign-in, verify your master password in Authier,
   choose the account, and select **Sign in**.
5. On a new browser, sign in to the same Authier vault and sync before signing in
   to the website. You do not need to enroll another website passkey.

Choose **Use another provider** to continue with your browser, operating system,
phone, or security key. Closing or canceling the Authier window cancels the
request. Passkeys appear under **Passkeys** in the vault, where their account and
website can be inspected and the item deleted. Deleting a vault item does not
remove the site's registration; remove it from the site's security settings too.

Existing passkeys stored by a browser, operating system, or hardware key cannot
be imported by this feature. Enroll a new passkey in Authier once for those
websites. Password/TOTP CSV exports do not contain passkeys; use Authier vault
sync to move them between browsers.

## Compatibility and scope

- Chromium-based Brave and Edge, Chromium 111 or later; Firefox 128 or later.
  The extension supports both the Chromium Manifest V3 and Firefox Manifest V2
  builds. Firefox's MAIN-world content scripts require Firefox 128.
- Top-level HTTPS pages, plus `http://localhost` for development.
- ES256 / P-256, discoverable credentials, account selection, allow/exclude
  credential lists, user verification by master password, and none attestation.
- Embedded frames and conditional/silent mediation use the native provider.
  Requests requiring roaming authenticators, enterprise attestation, PRF,
  largeBlob, legacy AppID, or unsupported required extension features also use
  the native provider. Site/browser restrictions on extension injection still
  apply. This does not add a mobile OS passkey provider.
- Registration waits for encrypted backend persistence. Signing in can use an
  already synced local credential without a network request to Authier.

The bridge preserves the browser's credential API for unsupported requests and
non-passkey credentials. It returns browser-compatible credential objects,
ArrayBuffer responses, public-key accessors, and JSON serialization.

## Security and persistence

The browser-supplied message sender identifies the requesting origin. RP IDs
must be that host or a permitted parent domain; public and private suffixes,
unrelated domains, insecure origins, and embedded frames are rejected. Passkey
signatures bind the challenge, origin, and RP ID hash.

A separate extension window shows the trusted origin and obtains explicit
approval. Each operation verifies the master password. Approval is bound to one
request, one tab, and the current unlocked vault session, and expires after one
minute. Navigation, cancellation, timeouts, vault changes, and window closure
invalidate pending requests. Page messages cannot approve an operation.

Keys are generated with WebCrypto. The complete passkey record, including its
private JWK, is encrypted with the existing vault encryption before backend
storage. Only public registration data or assertions return to the website.
Passkeys are excluded from password autofill responses and plaintext CSV
exports. Passkeys sync even when TOTP sync is disabled and count toward the
login credential allowance.

Synced credentials use a zero signature counter and set backup eligibility/state
flags. User verification is only asserted after a successful master-password
check. The authenticator uses none attestation and does not claim hardware key
protection or biometric verification.

## Rollout and development

Apply the generated PASSKEY enum migration before deploying the backend or
releasing extensions that write passkeys. Use the project's normal migration
and deployment commands; no production migration is run by tests. Update clients
that share the vault before enrolling passkeys: older clients do not understand
the new secret kind.

Build Chromium with the normal `generateManifest` and `prodBuild` scripts.
For Firefox, set `MANIFEST_VERSION=2` for **both** scripts. The approval page and
both bridge scripts are included in the build. No extra browser permission is
needed beyond the extension's existing website access.

The checked-in UI scenarios are `passkey-approval` and `passkey-vault` under
`web-extension/ui-preview`. Passkey unit tests cover independent cryptographic
verification, encrypted round trips, RP isolation, user verification, request
ownership, fallback, cancellation, and persistence failures. Backend tests use
PGlite. Browser tests live under `web-extension/tests/passkeys` and the UI
preview tests under `web-extension/tests/ui-preview`.

Implementation references: [W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/),
[Firefox 128 extension changes](https://blog.mozilla.org/addons/2024/07/10/manifest-v3-updates-landed-in-firefox-128/),
and [MDN content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts).

Run focused checks from `web-extension`:

```sh
pnpm test:passkeys
pnpm playwright:passkeys
pnpm preview:ui:check
pnpm playwright:ui-preview
```

The packaged-extension test requires a Chromium build with a configured API URL.
For an isolated test build (all requests are mocked by the test):

```sh
MANIFEST_VERSION=3 pnpm generateManifest
API_URL=https://authier.test/graphql pnpm prodBuild
pnpm playwright:passkeys:extension
```

Do not publish that test build: use the release environment's API URL for releases.
