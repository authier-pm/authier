export const getBackendOrigin = () => {
  const origin = new URL(process.env.BACKEND_URL ?? 'https://api.authier.pm')
  if (
    origin.username ||
    origin.password ||
    (origin.protocol !== 'https:' &&
      !(
        process.env.NODE_ENV !== 'production' &&
        origin.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(origin.hostname)
      ))
  ) {
    throw new Error('BACKEND_URL must be a trusted HTTPS origin')
  }
  return origin.origin
}
