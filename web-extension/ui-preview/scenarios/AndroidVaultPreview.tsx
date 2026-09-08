import vaultScreenshot from '../../../docs/screenshots/android-vault.png'
import totpScreenshot from '../../../docs/screenshots/android-totp.png'
import autofillScreenshot from '../../../docs/screenshots/android-autofill.png'

// Compose runs in Android, so this scenario displays captures from the actual
// debug app instead of maintaining a second implementation of its UI in React.
const screens = [
  {
    title: 'Passwords',
    image: vaultScreenshot,
    description: 'The native vault with synthetic demo accounts.'
  },
  {
    title: 'Authenticator',
    image: totpScreenshot,
    description: 'TOTP codes generated locally on Android.'
  },
  {
    title: 'Autofill',
    image: autofillScreenshot,
    description: 'Explicit account selection for a matching native app.'
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
