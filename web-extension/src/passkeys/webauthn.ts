import { passkeySchema, type PasskeyData } from '@shared/passkeySchema'
import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { z } from 'zod'
import {
  concatBytes,
  encodeCbor,
  es256SignatureToDer,
  fromBase64url,
  toBase64url
} from './encoding'

const base64urlSchema = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9_-]+$/)
const userVerificationSchema = z.enum(['required', 'preferred', 'discouraged'])
const credentialDescriptorSchema = z.object({
  type: z.literal('public-key'),
  id: base64urlSchema.max(1364),
  transports: z.array(z.string().max(32)).max(16).optional()
})
const commonOptions = {
  challenge: base64urlSchema.max(87384),
  extensions: z.record(z.string().max(128), z.unknown()).optional(),
  timeout: z.number().nonnegative().finite().optional()
}

export const creationOptionsSchema = z.object({
  ...commonOptions,
  rp: z.object({
    id: z.string().min(1).max(253).optional(),
    name: z.string().max(256)
  }),
  user: z.object({
    id: base64urlSchema.max(86),
    name: z.string().max(256),
    displayName: z.string().max(256)
  }),
  pubKeyCredParams: z
    .array(z.object({ type: z.literal('public-key'), alg: z.number().int() }))
    .max(64),
  excludeCredentials: z.array(credentialDescriptorSchema).max(128).optional(),
  authenticatorSelection: z
    .object({
      authenticatorAttachment: z
        .enum(['platform', 'cross-platform'])
        .optional(),
      residentKey: z.enum(['required', 'preferred', 'discouraged']).optional(),
      requireResidentKey: z.boolean().optional(),
      userVerification: userVerificationSchema.optional()
    })
    .optional(),
  attestation: z.enum(['none', 'direct', 'indirect', 'enterprise']).optional()
})

export const requestOptionsSchema = z.object({
  ...commonOptions,
  rpId: z.string().min(1).max(253).optional(),
  allowCredentials: z.array(credentialDescriptorSchema).max(128).optional(),
  userVerification: userVerificationSchema.optional()
})

export type PasskeyCredentialDescriptor = z.infer<
  typeof credentialDescriptorSchema
>
export type PasskeyCreationOptions = z.infer<typeof creationOptionsSchema>
export type PasskeyRequestOptions = z.infer<typeof requestOptionsSchema>

export type PasskeyCredentialResult = {
  id: string
  rawId: string
  type: 'public-key'
  authenticatorAttachment: 'platform'
  clientExtensionResults: { credProps?: { rk: boolean } }
  response: {
    clientDataJSON: string
    authenticatorData: string
    attestationObject?: string
    signature?: string
    userHandle?: string
    publicKey?: string
    publicKeyAlgorithm?: number
    transports?: string[]
  }
}

/** Origin must come from the browser's trusted sender metadata, never page data. */
export const validateRpId = (
  requestedRpId: string | undefined,
  origin: string
): string => {
  const url = new URL(origin)
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && url.hostname === 'localhost')
  ) {
    throw new DOMException('Passkeys require a secure website', 'SecurityError')
  }
  const rpId = requestedRpId ?? url.hostname
  const isDomain =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
      rpId
    )
  if (
    !isDomain ||
    rpId.length > 253 ||
    (rpId !== url.hostname && !url.hostname.endsWith(`.${rpId}`))
  ) {
    throw new DOMException(
      'The passkey domain does not match this website',
      'SecurityError'
    )
  }
  if (rpId === 'localhost' && url.hostname === 'localhost') return rpId
  // Includes private suffixes: tenant.github.io must never request rpId github.io.
  if (!getDomainNameAndTldFromUrl(`https://${rpId}`)) {
    throw new DOMException(
      'A passkey domain must be a registrable domain',
      'SecurityError'
    )
  }
  return rpId
}

/** Unsupported requests should use the browser's native authenticator instead. */
export const getUnsupportedPasskeyReason = (
  options: PasskeyCreationOptions | PasskeyRequestOptions,
  kind: 'create' | 'get'
): string | null => {
  if (kind === 'create' && 'rp' in options) {
    if (
      options.pubKeyCredParams.length &&
      !options.pubKeyCredParams.some(
        ({ type, alg }) => type === 'public-key' && alg === -7
      )
    ) {
      return 'Authier supports ES256 passkeys'
    }
    if (
      options.authenticatorSelection?.authenticatorAttachment ===
      'cross-platform'
    ) {
      return 'This website requires a roaming authenticator'
    }
    if (options.attestation === 'enterprise')
      return 'Enterprise attestation requires another authenticator'
  }
  const extensions = options.extensions
  if (!extensions) return null
  for (const key of [
    'prf',
    'largeBlob',
    'appid',
    'appidExclude',
    'hmacCreateSecret',
    'hmacGetSecret'
  ]) {
    if (extensions[key] !== undefined && extensions[key] !== false)
      return `The ${key} extension requires another authenticator`
  }
  if (extensions.enforceCredentialProtectionPolicy === true)
    return 'Enforced credential protection requires another authenticator'
  return null
}

const assertSupported = (
  options: PasskeyCreationOptions | PasskeyRequestOptions,
  kind: 'create' | 'get'
) => {
  const reason = getUnsupportedPasskeyReason(options, kind)
  if (reason) throw new DOMException(reason, 'NotSupportedError')
}

const assertUserVerified = (
  requirement: UserVerificationRequirement | undefined,
  userVerified: boolean
) => {
  if (requirement === 'required' && !userVerified) {
    throw new DOMException(
      'Verify your identity in Authier to use this passkey',
      'NotAllowedError'
    )
  }
}

const validateChallenge = (challenge: string): string => {
  const bytes = fromBase64url(challenge)
  if (!bytes.length || bytes.length > 65536)
    throw new TypeError('Invalid passkey challenge length')
  return challenge
}

const createClientData = (
  type: 'webauthn.create' | 'webauthn.get',
  challenge: string,
  origin: string
) =>
  new TextEncoder().encode(
    JSON.stringify({
      type,
      challenge: validateChallenge(challenge),
      origin: new URL(origin).origin,
      crossOrigin: false
    })
  )

const sha256 = async (bytes: Uint8Array<ArrayBuffer>) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))

const createAuthenticatorData = async (
  rpId: string,
  userVerified: boolean,
  attestedData?: Uint8Array
) => {
  // UP, BE and BS: approval is required and the vault syncs this credential.
  let flags = 0x01 | 0x08 | 0x10
  if (userVerified) flags |= 0x04
  if (attestedData) flags |= 0x40
  // Synced authenticators cannot maintain a monotonic counter across devices.
  const header = concatBytes(
    await sha256(new TextEncoder().encode(rpId)),
    new Uint8Array([flags, 0, 0, 0, 0])
  )
  return attestedData ? concatBytes(header, attestedData) : header
}

const matchesDescriptor = (
  passkey: PasskeyData,
  descriptor: PasskeyCredentialDescriptor
) => descriptor.type === 'public-key' && descriptor.id === passkey.credentialId

export const passkeyMatchesRequest = (
  passkey: PasskeyData,
  options: PasskeyRequestOptions,
  origin: string
): boolean => {
  const rpId = validateRpId(options.rpId, origin)
  return (
    passkey.rpId === rpId &&
    (!options.allowCredentials?.length ||
      options.allowCredentials.some((descriptor) =>
        matchesDescriptor(passkey, descriptor)
      ))
  )
}

/** Call only after approval, to avoid disclosing whether an account exists. */
export const assertNoExcludedPasskey = (
  passkeys: readonly PasskeyData[],
  options: PasskeyCreationOptions,
  origin: string
) => {
  const rpId = validateRpId(options.rp.id, origin)
  if (
    passkeys.some(
      (passkey) =>
        passkey.rpId === rpId &&
        options.excludeCredentials?.some((descriptor) =>
          matchesDescriptor(passkey, descriptor)
        )
    )
  ) {
    throw new DOMException(
      'A passkey for this account is already saved in Authier',
      'InvalidStateError'
    )
  }
}

/** Caller must obtain explicit user approval and persist the encrypted passkey before returning its credential. */
export const createPasskey = async (
  options: PasskeyCreationOptions,
  origin: string,
  userVerified: boolean
): Promise<{ passkey: PasskeyData; credential: PasskeyCredentialResult }> => {
  const rpId = validateRpId(options.rp.id, origin)
  assertSupported(options, 'create')
  assertUserVerified(
    options.authenticatorSelection?.userVerification,
    userVerified
  )
  const userHandle = fromBase64url(options.user.id)
  if (!userHandle.length || userHandle.length > 64)
    throw new TypeError('A passkey user ID must contain 1 to 64 bytes')
  const clientDataJSON = createClientData(
    'webauthn.create',
    options.challenge,
    origin
  )
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  )
  const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey)
  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey('spki', keyPair.publicKey)
  )
  const credentialIdBytes = crypto.getRandomValues(new Uint8Array(32))
  const credentialId = toBase64url(credentialIdBytes)
  const passkey = passkeySchema.parse({
    credentialId,
    rpId,
    rpName: options.rp.name,
    userHandle: options.user.id,
    userName: options.user.name,
    userDisplayName: options.user.displayName,
    privateKeyJwk,
    createdAt: new Date().toISOString(),
    url: new URL(origin).origin,
    label: options.rp.name,
    iconUrl: null
  })
  const coseKey = encodeCbor(
    new Map<number, number | Uint8Array>([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, fromBase64url(passkey.privateKeyJwk.x)],
      [-3, fromBase64url(passkey.privateKeyJwk.y)]
    ])
  )
  // None attestation uses an all-zero AAGUID and does not identify the device.
  const attestedData = concatBytes(
    new Uint8Array(16),
    new Uint8Array([0, credentialIdBytes.length]),
    credentialIdBytes,
    coseKey
  )
  const authenticatorData = await createAuthenticatorData(
    rpId,
    userVerified,
    attestedData
  )
  const attestationObject = encodeCbor(
    new Map<string, string | Uint8Array | Map<string, never>>([
      ['fmt', 'none'],
      ['attStmt', new Map<string, never>()],
      ['authData', authenticatorData]
    ])
  )
  return {
    passkey,
    credential: {
      id: credentialId,
      rawId: credentialId,
      type: 'public-key',
      authenticatorAttachment: 'platform',
      clientExtensionResults:
        options.extensions?.credProps === true
          ? { credProps: { rk: true } }
          : {},
      response: {
        clientDataJSON: toBase64url(clientDataJSON),
        authenticatorData: toBase64url(authenticatorData),
        attestationObject: toBase64url(attestationObject),
        publicKey: toBase64url(publicKey),
        publicKeyAlgorithm: -7,
        transports: ['internal']
      }
    }
  }
}

export const getPasskeyAssertion = async (
  passkey: PasskeyData,
  options: PasskeyRequestOptions,
  origin: string,
  userVerified: boolean
): Promise<PasskeyCredentialResult> => {
  assertSupported(options, 'get')
  assertUserVerified(options.userVerification, userVerified)
  if (!passkeyMatchesRequest(passkey, options, origin))
    throw new DOMException(
      'No matching passkey is available',
      'NotAllowedError'
    )
  const clientDataJSON = createClientData(
    'webauthn.get',
    options.challenge,
    origin
  )
  const authenticatorData = await createAuthenticatorData(
    passkey.rpId,
    userVerified
  )
  const key = await crypto.subtle.importKey(
    'jwk',
    passkey.privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )
  const signedData = concatBytes(
    authenticatorData,
    await sha256(clientDataJSON)
  )
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    signedData
  )
  return {
    id: passkey.credentialId,
    rawId: passkey.credentialId,
    type: 'public-key',
    authenticatorAttachment: 'platform',
    clientExtensionResults: {},
    response: {
      clientDataJSON: toBase64url(clientDataJSON),
      authenticatorData: toBase64url(authenticatorData),
      signature: toBase64url(es256SignatureToDer(new Uint8Array(signature))),
      userHandle: passkey.userHandle
    }
  }
}
