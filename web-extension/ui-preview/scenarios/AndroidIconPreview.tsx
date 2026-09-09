import launcherIcon from '../../../android-app/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'
import roundIcon from '../../../android-app/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png'

// These are the actual launcher resources packaged into the Android APK.
export const AndroidIconPreview = () => (
  <main
    style={{
      minHeight: '100vh',
      background: '#101513',
      color: '#e6eee9',
      padding: 40,
      fontFamily: 'system-ui, sans-serif'
    }}
  >
    <h1 style={{ fontSize: 28, margin: '0 0 12px' }}>Authier Android icon</h1>
    <p style={{ color: '#a5b7ac', marginBottom: 32 }}>
      The original golden key, using our existing Android assets.
    </p>
    <div style={{ display: 'flex', gap: 64 }}>
      {[
        { title: 'Standard launcher icon', image: launcherIcon },
        { title: 'Round launcher icon', image: roundIcon }
      ].map(({ title, image }) => (
        <figure key={title} style={{ margin: 0 }}>
          <img src={image} alt={title} width={96} height={96} />
          <figcaption style={{ marginTop: 16, color: '#a5b7ac', fontSize: 14 }}>
            {title}
          </figcaption>
        </figure>
      ))}
    </div>
  </main>
)
