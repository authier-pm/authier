const defaultApiOrigin = 'http://localhost:5051'

export const apiOrigin = (
  import.meta.env.VITE_API_ORIGIN ?? defaultApiOrigin
).replace(/\/$/, '')
