export function clearLegacyVaultStorage(request: Request): Response | null {
  const url = new URL(request.url)
  if (url.pathname !== '/clear-legacy-vault') return null
  if (
    request.method !== 'POST' ||
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('Sec-Fetch-Site') !== 'same-origin'
  )
    return new Response('Forbidden', { status: 403 })
  return new Response(null, {
    status: 204,
    headers: { 'Clear-Site-Data': '"storage"', 'Cache-Control': 'no-store' }
  })
}

export default {
  fetch(
    request: Request,
    env: { ASSETS: { fetch: (request: Request) => Promise<Response> } }
  ) {
    return clearLegacyVaultStorage(request) ?? env.ASSETS.fetch(request)
  }
}
