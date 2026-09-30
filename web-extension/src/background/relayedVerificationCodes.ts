import debug from 'debug'
import { relayedCodePayloadSchema } from '@shared/relayedVerificationCode'
import { apolloClient } from '@src/apollo/apolloClient'
import { device } from './ExtensionDevice'
import type { RelayedVerificationCode } from './verificationCodes'
import {
  RelayedVerificationCodesDocument,
  type RelayedVerificationCodesQuery,
  type RelayedVerificationCodesQueryVariables
} from './relayedVerificationCodes.codegen'

const log = debug('au:relayedVerificationCodes')

/** Codes stay end-to-end encrypted on the server until this vault is unlocked. */
export const fetchRelayedVerificationCodes = async (): Promise<
  RelayedVerificationCode[]
> => {
  const state = device.state
  if (!state) return []
  const { data } = await apolloClient.query<
    RelayedVerificationCodesQuery,
    RelayedVerificationCodesQueryVariables
  >({ query: RelayedVerificationCodesDocument, fetchPolicy: 'no-cache' })
  // A lock or login during the request invalidates the key used below.
  if (!data || device.state !== state) return []
  const decrypted = await Promise.allSettled(
    data.me.relayedVerificationCodes.map(async (relayed) => ({
      ...relayedCodePayloadSchema.parse(
        JSON.parse(await state.decrypt(relayed.encrypted))
      ),
      id: relayed.id,
      deviceName: relayed.deviceName,
      expiresAt: Date.parse(relayed.expiresAt)
    }))
  )
  // A code relayed before a master password change cannot be decrypted with
  // the new key; it expires on the server within minutes. Show the others.
  return decrypted.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value]
    log('Skipping an unreadable relayed code', result.reason)
    return []
  })
}
