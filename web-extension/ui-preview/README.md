# Extension UI preview

This checked-in harness renders extension UI against predictable mock browser
and device state. Use it for visual development and screenshots instead of
creating one-off harnesses outside the repository.

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
