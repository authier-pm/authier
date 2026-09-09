# Authier for Android

A native Kotlin and Jetpack Compose client for Authier. This is the current mobile client; the legacy React Native project has been removed.

## Install and stay up to date

Use **[Set up with Obtainium](https://www.authier.pm/download#android)** for automatic
updates from our signed GitHub Releases. Install Obtainium, open the setup link
again, confirm the Authier configuration, then install Authier through Obtainium.
Keep background updates enabled. Eligible updates install automatically on Android
12+; older Android versions receive an update notification requiring confirmation.
Checks run periodically, so publication does not instantly update every phone.

Already installed the signed APK? Install/update it in place through Obtainium to
let Obtainium handle subsequent updates. **Do not uninstall Authier**: uninstalling
clears the local vault. The configuration selects only native Android release APKs,
excludes prereleases and extension releases, and needs no GitHub account or token.

## Build and run

The launcher icons in `app/src/main/res/mipmap-*` contain the original golden-key
artwork at all five Android densities, including the round variants. Obtainium displays the installed APK's launcher
icon, so icon changes take effect when the updated APK is installed.

Install JDK 17 and Android SDK 35 with build tools 35.0.0. On Apple Silicon, use an ARM64 JDK. Set `ANDROID_HOME` or create the ignored `local.properties` containing `sdk.dir=/absolute/path/to/Android/sdk`.

```sh
cd android-app
./gradlew :app:assembleDebug :app:testDebugUnitTest
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n dev.authier.android.debug/dev.authier.android.MainActivity
```

Open the project directory in Android Studio for regular development. Minimum supported Android version is 8.0 (API 26), target and compile SDK are 35. Debug builds use `dev.authier.android.debug` and can coexist with the signed production app, `dev.authier.android`. See [release publishing](releasing.md) for tag builds and GitHub Releases.

The server defaults to `https://api.authier.pm`. It must have the new `/api/v1` HTTP API deployed before this application can sign in. The sign-in screen has Server settings for self-hosted instances. For a backend running on the emulator host, a debug build can use `http://10.0.2.2:3000` (substitute the backend port). Release builds require HTTPS.

The HTTP client and wire models are generated from the monorepo OpenAPI contract. `ApiFacade.kt` maps them into the app's domain types; do not edit the `generated` directory by hand. See the root API documentation and generation scripts when changing a contract.

## Implemented flows

- Create an account, request device approval, and sign in using the approved encrypted challenge. Existing installations can approve or reject new device requests.
- Unlock the local vault with the master password, including while offline. The password and plaintext vault items are never written to disk. Saved unlock keys are encrypted by Android Keystore.
- Create, edit, delete and search passwords and TOTP entries. Generate random passwords and copy passwords or current verification codes.
- Keep an encrypted outbox while offline. Sync reuses each operation ID, detects stale writes, applies opaque cursor pages atomically, and retains deletion tombstones to avoid resurrecting records during history replay.
- Resolve conflicts by preserving/copying the local value, then discarding the pending change and loading the server version. Pending deletions can also be resolved from Settings.
- View/remove other devices, configure device-approval policy, and select a per-phone idle lock timeout from 1 minute to 1 day, or lock on background. Timed unlock survives backgrounding, process death, force-stop and reboot until expiry. Changing the timeout works offline. Manual locking immediately clears the saved timed session.
- Refresh expired access tokens, reconnect a revoked/expired server session without dropping pending ciphertext, and sign out after pending changes are synchronized or discarded.

Android Autofill supports native app login forms with exact package associations, timed session recovery, password or fingerprint unlock, and account selection. Enable Authier from Settings. In another app, unlock Authier, choose or search for a saved login, and confirm “Use login and fill” to remember the app automatically. Linked accounts appear first on future requests; “Choose another saved login” links a different account. Each login currently supports one Android app; the confirmation explicitly identifies any link being replaced. Associations are encrypted and queued locally, then synced when Authier is next opened and unlocked. Items with pending writes must be synced or resolved before linking. Manual package entry remains available in the password editor. WebViews and ambiguous forms are deliberately excluded from matching.

Passkeys created by the browser extension remain encrypted in Android's synchronized snapshot, including deletion records. They are excluded from the password/TOTP editor, native Autofill, and unsupported-payload error reporting. This Android version does not list, edit, create, or authenticate with passkeys; manage them in the browser extension. Native sync preserves passkey ciphertext without decoding or reencoding it.

This initial native application does not yet implement Android Credential Provider, camera QR scanning, push notifications, or encrypted import/export. TOTP setup keys can be entered manually. Device approval checks are explicit through the sign-in button; device requests refresh on the Devices tab.

## Fingerprint unlock

Unlock once with your master password, then open Settings → Fingerprint unlock.
If no biometric is enrolled, **Register fingerprint in Android** opens system
settings; return to Authier and enable the feature. Confirm the biometric prompt
to wrap the vault key with an authentication-per-use Android Keystore key.
The lock screen and Autofill then offer **Unlock with fingerprint**. Android can
also accept another Class 3 biometric. Cancellation, lockout or unavailable hardware
leave the master-password option available. Changing biometric enrollment invalidates
the biometric key; unlock with the password and set it up again.

## Local security

Timed sessions and biometric unlock keys live in `noBackupFilesDir/vault-unlock.json`
under separate AES-256-GCM Keystore keys, bound to the local account and device.
Only wrapped keys are persisted. Timed sessions include authenticated timestamps;
expiry is checked before revealing the vault or accepting an interaction, using
both wall time and elapsed time during the same boot. Reboot uses the original
wall-clock deadline. Backgrounding and restarting never renew the timeout by
themselves. Touch activity renews it. Sign-out clears both keys; manual lock clears
only the timed key, leaving fingerprint unlock available. Clearing app data or
losing Keystore keys requires a password again.

The atomic snapshot lives in the app's `noBackupFilesDir`. It contains ciphertext, metadata, sync state, and encrypted pending operations. Android Keystore protects persisted access/refresh tokens using AES-256-GCM. Android backup is disabled, and `FLAG_SECURE` prevents screenshots and recent-task previews for real vaults. Password/code clipboard entries are marked sensitive on Android 13+ and expire after 30 seconds. Cleanup runs when clipboard access is available; Android may defer this until Authier regains focus. Authier only clears its own expired clip.

Encrypted payloads are byte-compatible with Authier's browser client: PBKDF2-HMAC-SHA512 (600,000 iterations, 16-byte account salt), AES-256-GCM, and Base64 of `salt || 12-byte IV || ciphertext || 16-byte authentication tag`. Kotlin and WebCrypto both execute the checked-in interoperability vectors.

## Synthetic UI preview

Only debug builds accept the demo intent, which displays synthetic data and permits screenshots. The demo never talks to the API and never persists demo secrets. Real vault screenshots remain protected.

```sh
adb shell am force-stop dev.authier.android.debug
adb shell am start -n dev.authier.android.debug/dev.authier.android.MainActivity --ez demo true
adb exec-out screencap -p > captures/vault.png
adb shell am start -n dev.authier.android.debug/dev.authier.android.AutofillPreviewActivity
adb exec-out screencap -p > captures/autofill.png
```

Create `captures/` before capturing. A matching checked-in scenario is maintained in `web-extension/ui-preview` for the monorepo's UI review workflow. Native screenshots should be taken from this app, not substituted with that web scenario.

## Failed request details

Tap an API error banner to inspect its HTTP status, endpoint, response body, and
Cloudflare request ID (when available). The response text is selectable. Diagnostics
stay in memory, clear when dismissed or the vault locks, and contain no outgoing
request body or authorization headers. Responses over 64 KiB are explicitly truncated.

For a synthetic screenshot, launch the debug-only `ApiErrorPreviewActivity` and tap
the banner. This preview reads no vault data and makes no network requests.

## Unlock regression checks

Run `./gradlew :app:testDebugUnitTest :app:connectedDebugAndroidTest` with a clean
debug emulator. Instrumentation covers encrypted key recovery, expiry, account
isolation, offline timeout changes, backgrounding, activity recreation and manual
locking. The opt-in `UnlockRestartFixture` seeds an offline synthetic vault for
host-driven force-stop/reboot checks (`-e unlockFixture seed`, or `clear` to remove it).

For the real biometric crypto round trip, enroll a fingerprint on the emulator,
install the debug app and its androidTest APK, and run:

```sh
adb shell am instrument -w -e class dev.authier.android.BiometricUnlockTest \
  -e biometricTest true dev.authier.android.debug.test/androidx.test.runner.AndroidJUnitRunner
```

Run `adb emu finger touch 1` from another terminal for both the enable and unlock
prompts. This test uses authentication-per-use Keystore encryption and decryption
with the production prompt and clears its synthetic vault afterward.
