import './chromeRuntimeListener'

import debug from 'debug'
import { EncryptedSecretGql } from '../../../shared/generated/graphqlBaseTypes'

export const log = debug('au:backgroundPage')
localStorage.debug = 'au:*' // enable all debug messages

const broadcast = new BroadcastChannel('test-channel')

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
  EncryptedSecretGql,
  'id' | 'encrypted' | 'kind' | 'label' | 'iconUrl' | 'url'
>

export interface IBackgroundStateSerializableLocked {
  email: string
  userId: string
  secrets: Array<SecretSerializedType>
}

export interface IBackgroundStateSerializable
  extends IBackgroundStateSerializableLocked {
  masterEncryptionKey: string
  encryptionSalt: string
}

export const lockTime = 10000 * 60 * 60 * 8
