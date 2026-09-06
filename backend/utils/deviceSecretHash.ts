import { timingSafeEqual } from 'node:crypto'

const iterations = 600_000
const deriveVerifier = async (
  secret: string,
  salt: Uint8Array<ArrayBuffer>
) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return Buffer.from(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
      key,
      256
    )
  )
}

export const hashDeviceSecret = async (secret: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const verifier = await deriveVerifier(secret, salt)
  return `pbkdf2-sha256:${iterations}:${Buffer.from(salt).toString('hex')}:${verifier.toString('hex')}`
}

export const verifyDeviceSecret = async (secret: string, verifier: string) => {
  // Existing credentials are one-way hashed by the SQL migration and rotated
  // to the salted format on the next successful device login/password change.
  if (/^[a-f0-9]{64}$/.test(verifier)) {
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(secret)
    )
    return timingSafeEqual(Buffer.from(digest), Buffer.from(verifier, 'hex'))
  }
  const match = /^pbkdf2-sha256:600000:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(
    verifier
  )
  if (!match) return false
  const digest = await deriveVerifier(
    secret,
    new Uint8Array(Buffer.from(match[1], 'hex'))
  )
  return timingSafeEqual(digest, Buffer.from(match[2], 'hex'))
}
