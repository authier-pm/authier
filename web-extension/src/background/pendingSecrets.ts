import browser from 'webextension-polyfill'
import { z } from 'zod'
import { createVaultSecretInputSchema } from '@shared/orpc/schemas'
import type { SecretSerializedType } from './backgroundPage'

export const PENDING_SECRET_PREFIX = 'pendingSecret:'
export const withVaultWriteLock = <T>(
  userId: string,
  work: () => Promise<T>,
  mode: 'shared' | 'exclusive' = 'shared'
) => navigator.locks.request(`authier-vault-writes:${userId}`, { mode }, work)
export type PendingSecretOwner = { userId: string; keyId: string }

// Enrollment verifiers change on re-login even when the vault key does not.
// This local-only fingerprint binds queued ciphertext to the actual key.
export async function pendingSecretKeyId(masterEncryptionKey: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`authier-pending-secret:${masterEncryptionKey}`)
  )
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

// An explicit allowlist: never persist a decrypted payload, master key, token,
// or plaintext enrollment secret in the retry queue. Read future kinds intact.
const pendingSecretSchema = z.object({
  userId: z.string(),
  keyId: z.string().min(1),
  createdAt: z.string(),
  operation: createVaultSecretInputSchema.extend({ kind: z.string().min(1) })
})
export type PendingSecret = z.infer<typeof pendingSecretSchema>

const storageKey = (entry: PendingSecret) =>
  `${PENDING_SECRET_PREFIX}${entry.userId}:${entry.operation.id}`

export const belongsToVaultKey = (
  entry: PendingSecret,
  owner: PendingSecretOwner
) => entry.userId === owner.userId && entry.keyId === owner.keyId

const activeVaultIdentitySchema = z.object({
  userId: z.string(),
  masterEncryptionKey: z.string().min(1)
})

// Storage events can arrive after a Web Lock is granted in another window.
// Check the shared session as well as the calling window's in-memory state.
export async function isCurrentStoredVaultKey(owner: PendingSecretOwner) {
  const { backgroundState } =
    await browser.storage.session.get('backgroundState')
  const parsed = activeVaultIdentitySchema.safeParse(backgroundState)
  if (!parsed.success || parsed.data.userId !== owner.userId) return false
  return (
    (await pendingSecretKeyId(parsed.data.masterEncryptionKey)) === owner.keyId
  )
}

export async function readPendingSecrets(
  userId: string
): Promise<PendingSecret[]> {
  const stored = await browser.storage.local.get(null)
  return Object.entries(stored)
    .filter(([key]) => key.startsWith(`${PENDING_SECRET_PREFIX}${userId}:`))
    .map(([, value]) => pendingSecretSchema.parse(value))
    .filter((entry) => entry.userId === userId)
}

export async function enqueueSecrets(entries: PendingSecret[]) {
  // Separate keys avoid read/modify/write races between popup, vault and worker.
  // A retry reuses both UUIDs and the exact ciphertext (including its IV).
  const parsed = entries.map((entry) => pendingSecretSchema.parse(entry))
  await browser.storage.local.set(
    Object.fromEntries(parsed.map((entry) => [storageKey(entry), entry]))
  )
}

export const acknowledgePendingSecret = (entry: PendingSecret) =>
  browser.storage.local.remove(storageKey(entry))

export const pendingSecretRecord = (
  entry: PendingSecret
): SecretSerializedType => ({
  id: entry.operation.id,
  kind: entry.operation.kind,
  encrypted: entry.operation.encrypted,
  createdAt: entry.createdAt,
  updatedAt: null,
  deletedAt: null
})
