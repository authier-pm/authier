# Extension UI preview

The `android-icon` scenario imports the actual standard and round Android launcher
resources. Run `pnpm playwright:ui-preview androidIcon.spec.ts` from `web-extension`
to capture `docs/screenshots/android-icon-preview.png`.

The `android-updates` scenario embeds the production Astro download page. Start
`pnpm --dir landing-page dev` from the repository root alongside the preview, or
run `pnpm exec playwright test --config playwrightAndroidUpdates.config.ts` from
`web-extension`. This starts both servers, verifies the Obtainium link and mobile
layout, and captures `docs/screenshots/android-updates.png` and
`android-updates-mobile.png`.

The same suite covers `android-landing`, which embeds the real homepage and verifies
the configured Obtainium links in its hero, platform list, and closing call to action.
It captures `docs/screenshots/android-landing.png` and `android-landing-mobile.png`.

This checked-in harness renders extension UI against predictable mock browser
and device state. Use it for visual development and screenshots instead of
creating one-off harnesses outside the repository.

The `kostkohratky-password` scenario reproduces the supplied Czech registration
form without live tokens. It runs production detection, classification validation,
the generator and password filling with a deterministic background classifier mock.
Run `bun run playwright:ui-preview kostkohratkyPassword.spec.ts` to verify the
first-field overlay, filling and cache reuse, and capture
`docs/screenshots/kostkohratky-password-generator.png`. The test also writes its
sanitized request to `web-extension/test-results/kostkohratky-classification-snapshot.json`.
To verify the real free router and database cache, set `OPENROUTER_API_KEY` in
`backend/.env`, then run from `backend`:

```sh
bun scripts/verifyPasswordFormClassification.ts ../web-extension/test-results/kostkohratky-classification-snapshot.json
```

The live check uses PGlite in memory. Production requires the generated database
migration and the `OPENROUTER_API_KEY` Worker secret before deploying the backend.

Add `&large-form=1` to the password scenario to include over a megabyte of terms
inside the form. Its browser test verifies that the classifier receives a compact
excerpt under 16,000 bytes of JSON-escaped HTML, preserves the password fields and
captions, and captures `docs/screenshots/kostkohratky-large-form-generator.png`.

Run it from `web-extension`:

```sh
pnpm preview:ui
```

Then open <http://127.0.0.1:4174>. The default scenario can also be selected
explicitly at <http://127.0.0.1:4174/?scenario=autofill-controls>.

To cover a new user-visible feature:

1. Add a preview component under `scenarios/` that imports the production UI.
2. Register it in `main.tsx` with a stable scenario name.
3. Extend the checked-in browser or device-state mocks when the component needs
   another capability.
4. Run `pnpm preview:ui:check` and capture the rendered scenario into
   `docs/screenshots/`.

Run the isolated Playwright suite for preview interactions with:

```sh
pnpm playwright:ui-preview
```

Keep reusable preview code and fixtures in this directory. Do not place them in
`/tmp`.

The `bitfinex-totp` scenario exercises the production account picker and OTP fill
against a synthetic Bitfinex login and its asynchronous document-level paste
handler. Its deliberately broad saved username selector also matches the OTP
boxes. The browser test verifies that the picker disappears on the second step,
checks every filled digit, and captures `docs/screenshots/bitfinex-totp.png`.

The `remembered-session` scenario renders the unlocked popup using the shared encrypted IndexedDB snapshot store. Reloading restores it without a password prompt. Its Playwright test captures `docs/screenshots/remembered-session-restart.png`.

The `passkey-vault` scenario renders the production passkey detail card, including the website and account without exposing key material. Its Playwright test captures `docs/screenshots/passkey-vault.png`. The `passkey-approval` scenario renders the extension's passkey approval dialog.

The `android-vault` scenario displays actual emulator captures of the Kotlin app's
password, TOTP and native autofill screens. Compose cannot be imported into this React harness;
the captures are the production native UI with debug-only synthetic data, not a
second web implementation. Refresh `docs/screenshots/android-vault.png` and
`android-totp.png` from the Android demo intent (see `android-app/README.md`) and
`android-autofill.png` from its debug `AutofillPreviewActivity` and
`android-autofill-association.png` after selecting a login in that preview, then run its
Playwright test to render `docs/screenshots/android-ui-preview.png`.

The Android gallery also includes `android-api-error.png`, captured from the debug-only
`ApiErrorPreviewActivity` after tapping its error banner. It uses the production
response dialog with a synthetic HTTP 500 payload and makes no network requests.

The Android gallery includes `android-unlock-settings.png` and
`android-fingerprint-unlock.png`. Capture the production Compose screens with the
debug demo intent and `--ei tab 2` (settings) or `--ez locked true` (unlock),
force-stopping the debug app before each launch. These scenarios cover a one-day
idle timeout that survives app restarts and the biometric unlock alternative.

The `android-blog` scenario embeds the production native Android launch article.
Run the `Android launch article` test in `playwrightAndroidUpdates.config.ts` to
verify desktop/mobile layout, screenshot assets and download links, and capture
`docs/screenshots/android-blog-desktop.png` and `android-blog-mobile.png`.
