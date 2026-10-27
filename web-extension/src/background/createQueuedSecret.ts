import {
  createVaultSecretInputSchema,
  mobileSecretRecordSchema
} from '@shared/orpc/schemas'
import { API_URL } from '@src/apollo/API_URL'
import { ensureAccessToken } from '@src/apollo/tokenRefresh'
import { getAccessToken } from '@src/util/accessTokenExtension'
import { isCurrentStoredVaultKey, type PendingSecret } from './pendingSecrets'
import { jwtDecode } from 'jwt-decode'

export async function createQueuedSecret(
  entry: PendingSecret,
  isCurrentSession: () => boolean
) {
  const operation = createVaultSecretInputSchema.parse(entry.operation)
  await ensureAccessToken()
  const token = await getAccessToken()
  // Refresh may have locked/replaced the session or resumed another account.
  if (!token || !(await isCurrentStoredVaultKey(entry)) || !isCurrentSession())
    throw new Error('Unlock this vault to synchronize saved items')
  if (jwtDecode<{ userId: string }>(token).userId !== entry.userId)
    throw new Error('The saved item belongs to another account')
  const response = await fetch(
    `${API_URL.replace(/\/graphql\/?$/, '')}/api/v1/vault/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(operation),
      signal: AbortSignal.timeout(15_000)
    }
  )
  if (!response.ok)
    throw new Error(
      `Saved on this device; synchronization failed (${response.status})`
    )
  const record = mobileSecretRecordSchema.parse(await response.json())
  if (
    record.id !== operation.id ||
    record.kind !== operation.kind ||
    record.encrypted !== operation.encrypted ||
    record.deletedAt
  ) {
    throw new Error('Authier did not confirm the saved item')
  }
  return record
}
