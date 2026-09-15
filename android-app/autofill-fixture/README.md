# Native autofill smoke fixture

This separate development app exercises the actual Android autofill service. It has no Internet
permission, writes no credentials to disk or logs, and is not part of the Authier APK.
Use synthetic data only.

```sh
cd android-app
./gradlew :app:assembleDebug :autofill-fixture:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r autofill-fixture/build/outputs/apk/debug/autofill-fixture-debug.apk
```

Sign into a test account in Authier. Add a password with username `autofill-demo`, password
`autofill-demo-password`, and Android package `dev.authier.autofillfixture`. Enable Authier in the
Android autofill settings from Authier's Settings screen.

```sh
adb shell am start -n dev.authier.autofillfixture/.AutofillFixtureActivity
```

Tap **Request autofill**, choose **Unlock Authier to fill this app**, enter the test vault's master
password, and explicitly choose the matching login. The picker must identify the exact target package.
Choose the returned suggestion if Android presents another dropdown, then tap **Check synthetic credentials**.
The expected result is **PASS: username and password filled correctly**.

Reject cases (force-stop the fixture between cases to discard previous form sessions):

```sh
adb shell am force-stop dev.authier.autofillfixture
adb shell am start -n dev.authier.autofillfixture/.AutofillFixtureActivity --ez ambiguous true
adb shell am force-stop dev.authier.autofillfixture
adb shell am start -n dev.authier.autofillfixture/.AutofillFixtureActivity --ez web true
```

The ambiguous native form and the WebView must receive no Authier suggestion. A login linked only to
`https://example.com` or a different package must not appear in the unlock picker. Canceling, using the
wrong master password, or backgrounding the picker must return no credentials.

The implementation follows the [Android autofill authentication flow](https://developer.android.com/identity/autofill/autofill-services).
It currently supports native login filling only; web/browser origin verification, automatic saving,
passkeys, and credential-manager integration are separate features.

## Password generation and web forms

`--ez signup true` creates two explicit new-password fields. `--ez change true`
adds a populated current-password field. Request autofill, choose **Create a
strong password with Authier**, then **Save and fill**. **Check synthetic
credentials** checks that both generated fields match and the current password
is unchanged. Canceling the Authier review must leave the vault file unchanged.

`--ez web true` loads a synthetic HTTPS form into WebView, with current, new,
and confirmation fields. The fixture never submits the form or makes a network
request. Authier must block filling while the fixture is an unverified embedded
app. To test browser origin reporting without contacting a real website, temporarily
select this development fixture as the emulator's default browser:

```sh
adb shell cmd role get-role-holders android.app.role.BROWSER
adb shell cmd role add-role-holder --user 0 android.app.role.BROWSER dev.authier.autofillfixture
adb shell am force-stop dev.authier.autofillfixture
adb shell am start -n dev.authier.autofillfixture/.AutofillFixtureActivity --ez web true
```

Tap the new-password field, create and save a password, then tap **Check generated
web password**. Restore the previous browser role and autofill provider afterward.
The fixture's browser intent filter exists solely for this test and is not in the
Authier application.

On a clean debug emulator, `UnlockRestartFixture` with `-e unlockFixture seed`
prepares an offline synthetic vault. After exactly one native and one web save,
`AutofillPersistenceFixture` with `-e autofillFixture verify` checks ciphertext,
queued creates, and separate app/site associations. Run the seed fixture with
`-e unlockFixture clear` to remove the synthetic vault afterward.
