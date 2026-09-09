// Render the production Astro page rather than duplicating its UI.
const WebsitePreview = ({ path }: { path: string }) => (
  <iframe
    title="Authier website"
    src={`http://127.0.0.1:4321${path}`}
    style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
  />
)

export const AndroidUpdatesPreview = () => (
  <WebsitePreview path="/download#android" />
)
export const AndroidLandingPreview = () => <WebsitePreview path="/" />
