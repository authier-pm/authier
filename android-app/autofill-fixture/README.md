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
