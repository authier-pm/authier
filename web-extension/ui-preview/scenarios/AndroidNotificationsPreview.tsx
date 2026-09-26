import notification from '../../../docs/screenshots/android-sign-in-notification.png'

// Real Android capture: Compose and the system notification shade cannot run in Vite.
export const AndroidNotificationsPreview = () => (
  <main className="min-h-screen bg-[#101213] p-8 text-white">
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Android sign-in notifications</h1>
      <p className="mt-3 max-w-xl text-slate-300">
        A real Firebase message delivered to the test emulator while Authier was
        in the background. Tap the alert to unlock and review devices.
      </p>
      <img
        src={notification}
        alt="Authier Android sign-in notification"
        className="mt-6 w-full max-w-[360px] rounded-3xl"
      />
    </div>
  </main>
)
