// Render the production Astro page rather than duplicating its UI.
const websitePreviewOrigin =
  import.meta.env.VITE_WEBSITE_PREVIEW_ORIGIN ?? 'http://127.0.0.1:4321'

const WebsitePreview = ({ path }: { path: string }) => (
  <iframe
    title="Authier website"
    src={new URL(path, websitePreviewOrigin).href}
    style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
  />
)

export const AndroidUpdatesPreview = () => (
  <WebsitePreview path="/download#android" />
)
export const AndroidLandingPreview = () => <WebsitePreview path="/" />

export const AndroidBlogPreview = () => (
  <WebsitePreview path="/blog/native-android-app" />
)

export const SeptemberReleaseBlogPreview = () => (
  <WebsitePreview path="/blog/email-codes-and-easier-sign-ins" />
)

export const OctoberReleaseBlogPreview = () => (
  <WebsitePreview path="/blog/sms-codes-and-device-recovery" />
)

export const HackingPrizeBlogPreview = () => (
  <WebsitePreview path="/blog/hack-authier-10-ltc" />
)
