import './chromeRuntimeListener'
import debug from 'debug'
import { EncryptedSecretQuery } from '../../../shared/generated/graphqlBaseTypes'
import { ISecret } from '@src/util/useDeviceState'

export const log = debug('au:backgroundPage')
localStorage.debug = 'au:*' // enable all debug messages

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(function(registration) {
      log(
        'ServiceWorker registration successful with scope: ',
        registration.scope
      )
    })
    .catch(function(err) {
      //registration failed :(
      log('ServiceWorker registration failed: ', err)
    })
} else {
  log('No service-worker on this browser')
}

export type SecretSerializedType = Pick<
  EncryptedSecretQuery,
  | 'id'
  | 'encrypted'
  | 'kind'
  | 'lastUsedAt'
  | 'createdAt'
  | 'deletedAt'
  | 'updatedAt'
>

export interface IBackgroundStateSerializableLocked {
  email: string
  userId: string
  secrets: Array<SecretSerializedType>
  encryptionSalt: string
  deviceName: string
  authSecretEncrypted: string
  authSecret: string
  lockTime: number
  autofill: boolean
  language: string
  theme: string
  syncTOTP: boolean
}

export interface IBackgroundStateSerializable
  extends IBackgroundStateSerializableLocked {
  masterEncryptionKey: string
  // decryptedSecrets: (ILoginSecret | ITOTPSecret)[]
}
