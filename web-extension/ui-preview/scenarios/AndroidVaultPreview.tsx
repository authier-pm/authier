import unlockSettingsScreenshot from '../../../docs/screenshots/android-unlock-settings.png'
import fingerprintScreenshot from '../../../docs/screenshots/android-fingerprint-unlock.png'
import automaticFingerprintScreenshot from '../../../docs/screenshots/android-fingerprint-auto-prompt.png'
import passwordFallbackScreenshot from '../../../docs/screenshots/android-fingerprint-password-fallback.png'
import errorScreenshot from '../../../docs/screenshots/android-api-error.png'
import vaultScreenshot from '../../../docs/screenshots/android-vault.png'
import totpScreenshot from '../../../docs/screenshots/android-totp.png'
import totpCameraEntryScreenshot from '../../../docs/screenshots/android-totp-camera-entry.png'
import totpCameraReviewScreenshot from '../../../docs/screenshots/android-totp-camera-review.png'
import autofillScreenshot from '../../../docs/screenshots/android-autofill.png'
import associationScreenshot from '../../../docs/screenshots/android-autofill-association.png'
import masterDevicesScreenshot from '../../../docs/screenshots/android-devices-master.png'
import transferMasterScreenshot from '../../../docs/screenshots/android-devices-transfer.png'
import memberDevicesScreenshot from '../../../docs/screenshots/android-devices-member.png'

// Compose runs in Android, so this scenario displays captures from the actual
// debug app instead of maintaining a second implementation of its UI in React.
const screens = [
  {
    title: 'Master device',
    image: masterDevicesScreenshot,
    description:
      'The current master is labeled. Only that device offers actions to transfer the role to another connected device.'
  },
  {
    title: 'Confirm master transfer',
    image: transferMasterScreenshot,
    description:
      'Review which device will take over and confirm before relinquishing the master role.'
  },
  {
    title: 'After master transfer',
    image: memberDevicesScreenshot,
    description:
      'The badge moves to the new master and transfer controls disappear from the former master.'
  },
  {
    title: 'Unlock settings',
    image: unlockSettingsScreenshot,
    description:
      'Choose an idle timeout up to one day that survives backgrounding and app restarts, and enable fingerprint unlock.'
  },
  {
    title: 'Automatic fingerprint prompt',
    image: automaticFingerprintScreenshot,
    description:
      'Opening a locked vault starts Android biometric authentication automatically. Choose Use master password or dismiss the prompt to enter your password.'
  },
  {
    title: 'Master password fallback',
    image: passwordFallbackScreenshot,
    description:
      'Dismissing fingerprint authentication leaves the password form ready, without reopening the prompt or showing an error. The fingerprint button remains available to retry.'
  },
  {
    title: 'Fingerprint unlock',
    image: fingerprintScreenshot,
    description:
      'Use Android biometrics after your timeout expires, with the master password available as a fallback.'
  },
  {
    title: 'Server response',
    image: errorScreenshot,
    description:
      'Tap a failed request banner to inspect the returned status, endpoint, request ID and payload.'
  },
  {
    title: 'Passwords',
    image: vaultScreenshot,
    description:
      'Lazy-loaded website favicons with the same saved-icon and hostname lookup as the browser extension.'
  },
  {
    title: 'Authenticator',
    image: totpScreenshot,
    description:
      'TOTP codes generated locally on Android, with lazy-loaded website icons.'
  },
  {
    title: 'Scan a setup code',
    image: totpCameraEntryScreenshot,
    description:
      'Add a 2FA account with the Android camera, with manual setup keys available as a fallback.'
  },
  {
    title: 'Review scanned account',
    image: totpCameraReviewScreenshot,
    description:
      'An actual emulator camera scan fills the account and code settings. Review before saving to the encrypted vault.'
  },
  {
    title: 'Autofill',
    image: autofillScreenshot,
    description:
      'Search saved logins directly from another app’s autofill request.'
  },
  {
    title: 'Link a login',
    image: associationScreenshot,
    description:
      'Confirm the target app before saving its association and filling.'
  }
]

export const AndroidVaultPreview = () => (
  <main
    style={{
      minHeight: '100vh',
      background: '#101513',
      color: '#e6eee9',
      padding: '40px',
      fontFamily: 'system-ui, sans-serif'
    }}
  >
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <p
        style={{
          color: '#8dccad',
          textTransform: 'uppercase',
          letterSpacing: '.16em',
          fontSize: 12
        }}
      >
        Authier / native Android
      </p>
      <h1 style={{ fontSize: 32, margin: '12px 0' }}>
        Your vault, on Android.
      </h1>
      <p style={{ color: '#a5b7ac', maxWidth: 640, lineHeight: 1.6 }}>
        Actual Jetpack Compose screens captured in the Android emulator. These
        preview accounts are synthetic; no real vault data appears here.
      </p>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginTop: 32 }}
      >
        {screens.map((screen) => (
          <figure key={screen.title} style={{ margin: 0, width: 340 }}>
            <img
              src={screen.image}
              alt={`Authier Android ${screen.title} screen`}
              style={{
                width: '100%',
                display: 'block',
                borderRadius: 20,
                border: '1px solid #34473c'
              }}
            />
            <figcaption style={{ marginTop: 16 }}>
              <strong>{screen.title}</strong>
              <p style={{ color: '#a5b7ac', fontSize: 14, lineHeight: 1.5 }}>
                {screen.description}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </main>
)
