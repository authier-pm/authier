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

## Autofill app linking — September 8, 2026

All 36 JVM tests pass, including new encrypted-association coverage for imported-field preservation, versioned outbox writes, pending-write protection, changed/deleted records, account/key changes, and invalid targets. Debug/release APK builds and both Android lint variants pass (zero errors). The UI-preview TypeScript check and Android gallery Playwright scenario pass.

Using a synthetic encrypted vault and the separate native `autofill-fixture` app in the emulator:

- A login without an Android association appeared in the picker after master-password unlock.
- Selecting it displayed the target package and explicit confirmation. Canceling left the stored snapshot byte-for-byte unchanged.
- Confirming saved an encrypted association and exactly one pending update, retaining an imported custom field. The fixture confirmed that username and password were filled immediately.
- A fresh autofill request showed the login under “Linked to this app.” Selecting it filled successfully without another confirmation or a second disk write.
- Synthetic vault data was removed and the emulator's previous autofill provider was restored afterward.

The service now uses [dataset authentication](https://developer.android.com/reference/android/service/autofill/Dataset.Builder#setAuthentication(android.content.IntentSender)) so selecting a login in Authier fills the form directly. Snapshot revision checks prevent a background app operation from overwriting an association saved by the picker.

Updated actual Compose captures: `docs/screenshots/android-autofill.png` and `android-autofill-association.png`. The checked-in `android-vault` preview includes both screens; its rendered gallery is `docs/screenshots/android-ui-preview.png`. No production API deployment or real-account sync was performed for this change.

## Approved login failure and response diagnostics — September 9, 2026

The JSON `completeDeviceLogin` integration test reproduces HTTP 500 when the hosted
Workers PBKDF2 iteration ceiling is enforced. Both migration-era SHA-256 verifiers
and existing 600,000-round salted verifiers are covered. With the portable fallback,
approved login, secret rotation, bootstrap, and repeat login succeed under the same
limit; incorrect enrollment secrets still fail. New verifier bytes match Node's
independent PBKDF2 implementation. This fixes the reproduced runtime incompatibility;
the production invocation log alone did not contain its underlying exception.

Validation: 39 backend tests across mobile login, mobile API, oRPC, security boundaries,
and error diagnostics; 38 Android JVM tests; debug/release builds and lint; backend
TypeScript; Cloudflare Worker dry-run bundle; UI-preview TypeScript and Android
gallery Playwright scenario. The error banner/dialog was exercised in the emulator.
HTTP payload tests cover JSON, HTML, malformed/empty bodies, oversized responses,
request correlation, and exclusion of outgoing secrets from diagnostic metadata.

The new screenshot `docs/screenshots/android-api-error.png` contains only synthetic
data from the debug-only `ApiErrorPreviewActivity`; release manifests exclude it.
No database migration or client vault re-encryption is needed for this fix. Backend
deployment is required for installed clients to benefit. The new APK adds tappable
response details; the server still masks unexpected internal errors in HTTP responses,
while recording error types, crypto-limit messages, and stack locations in Worker logs.

## Camera TOTP setup — September 10, 2026

Validated on an Android 14 / API 34 x86_64 emulator with synthetic demo data.
All 50 JVM tests pass, including QR pixel decoding, RFC 6238 output, provisioning
metadata/defaults/custom settings, and malformed/unsupported URI rejection.
Debug and release APK builds and both lint variants pass. The native
`TotpEditorTest` passes: manual fallback and Android Back preserve the unsaved
entry, neither saves/dismisses it, and explicit Save returns the unchanged draft.
UI-preview TypeScript and the Android gallery Playwright scenario pass.

The real camera pipeline was exercised using a synthetic QR image loaded into the
emulator’s virtual scene (`adb emu virtualscene-image wall <absolute-png-path>`).
Permission denial displayed recovery options, and manual fallback returned to the
editor. Granting permission opened the camera. Both a short setup URI and a URI
with percent-encoded account/issuer metadata scanned successfully. Rescanning
replaced the draft; explicit Save added exactly one entry, increasing the demo
TOTP count from three to four, with a locally generated code displayed.

Fresh native captures: `android-totp-camera-entry.png` and
`android-totp-camera-review.png` in `docs/screenshots/`. The review was captured
after a real camera scan, with the setup key hidden. The checked-in `android-vault`
scenario includes both and renders the refreshed `android-ui-preview.png`.
No real accounts, production database, deployment, or release publication were
used. Physical-device camera testing remains separate from emulator validation.

## Master-device management — September 10, 2026

Debug/release builds and lint pass, as do all 53 JVM tests and four native
`DeviceManagementTest` cases on the API 34 emulator. Coverage includes the
generated transfer request and server errors, signed-out target filtering,
confirmation/cancellation, master badge placement, and disabled/hidden controls
for busy, non-master, unknown-master, stale-role, and signed-out-target states.
The 14-test mobile API suite passes against PGlite, including a handoff regression
that rejects non-master requests and rejects the former master using its existing
session after transfer.

The debug demo exercises the real Compose screen and view model with synthetic
in-memory transfers. Fresh native captures are `android-devices-master.png`,
`android-devices-transfer.png`, and `android-devices-member.png`. The checked-in
Android UI gallery includes all three; its TypeScript check and Playwright render
pass. Production device transfers use the existing API and recheck server role
before submitting. No backend deployment or migration is required.
