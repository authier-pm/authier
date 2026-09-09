// Render the production Astro page rather than duplicating its UI.
export const AndroidUpdatesPreview = () => (
  <iframe
    title="Authier Android update setup"
    src="http://127.0.0.1:4321/download#android"
    style={{ width: '100%', height: '100vh', border: 0, display: 'block' }}
  />
)
