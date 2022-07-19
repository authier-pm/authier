import './chromeRuntimeListener'
import debug from 'debug'
import { EncryptedSecretQuery } from '../../../shared/generated/graphqlBaseTypes'

export const log = debug('au:backgroundPage')
localStorage.debug = 'au:*' // enable all debug messages

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then(function (registration) {
      log(
        'ServiceWorker registration successful with scope: ',
        registration.scope
      )
    })
    .catch(function (err) {
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
  | 'label'
  | 'iconUrl'
  | 'url'
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
  lockTime: string
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
