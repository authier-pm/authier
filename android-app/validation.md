# Native Android validation

Validated on 2026-09-08 with an Android 15 / API 35 ARM64 emulator and an isolated, temporary PGlite backend. No production account or production database was used.

## Automated checks

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest :app:lintDebug :app:assembleRelease :app:lintRelease
```

All 28 JVM tests passed. Debug and release APK builds passed; both Android lint variants reported zero errors. Tests exercise generated HTTP request/response serialization, nullable versus optional fields, cursor replay and tombstones, pending-write preservation, WebCrypto/JVM encryption vectors including Unicode, RFC TOTP vectors, imported payload normalization, and exact native-package autofill matching.

The release manifest was inspected: backup and cleartext traffic are disabled, and the debug autofill preview activity is absent. Release signing and production deployment remain separate steps.

## Passkey branch integration

After integrating the passkeys branch, the debug APK and Android lint were rebuilt successfully and all 32 JVM tests passed. Additional coverage verifies generated-client mixed password/passkey responses, passkey tombstones, opaque passkey snapshot/outbox preservation, and rejection of passkey payloads by the native editor/decoder. Unsupported kinds are filtered before decryption so they do not prevent password/TOTP unlock or produce corruption warnings. This validates compatibility with encrypted passkey sync; it does not add an Android passkey provider.

## Emulator checks

- Created an account through the real generated Retrofit client and the local `/api/v1` HTTP handler.
- Created and synchronized an encrypted password and a TOTP entry. Codes updated on screen.
- Restarted the application and unlocked the remembered vault with its master password.
- Removed the emulator's server connection. Offline unlock and local TOTP generation still worked.
- Edited a password offline. The persisted snapshot contained ciphertext and a pending update, without the synthetic username, password, master password, or edited URL in plaintext.
- Restarted/updated the application. The queued operation kept the same operation ID. Restoring connectivity uploaded it as revision 2 and emptied the outbox.
- Simulated an interrupted atomic write by leaving only the synthetic snapshot's `.bak` file. Relaunch restored the remembered vault successfully.
- Approved a second device from the native Devices screen. An independent TypeScript/WebCrypto client then decrypted the Android-created revision 2 and verified its fields. The TypeScript client wrote another encrypted item, which Android synchronized and displayed correctly.
- Enabled Authier's real Android Autofill service in the test emulator. The separate `autofill-fixture` app requested credentials, Authier required the master password and explicit account selection, and the fixture confirmed both values were filled correctly. This also passed offline. An ambiguous form with two password fields received no Authier suggestion.
- Repeated the complete Autofill flow after fixing an Android 15 lifecycle issue involving a duplicate `finish()` call. The fixture passed and the fresh Android runtime error log was empty.

The HTTP smoke test exposed optional-null serialization and permissive-policy challenge-approval bugs, which were fixed and covered by regression tests. The temporary backend was stopped after cross-client verification. Its device geolocation metadata dependency was unavailable; the app displayed that error while keeping device approvals usable.

Checked-in images in `docs/screenshots/android-vault.png`, `android-totp.png`, and `android-autofill.png` are fresh emulator captures of explicit debug-only synthetic scenarios. Real vault and real Autofill windows keep screenshot protection enabled.
