import { apolloClient } from '../apollo/ApolloClient'
import cryptoJS from 'crypto-js'
import SInfo from 'react-native-sensitive-info'
import { generateEncryptionKey } from '../../shared/generateEncryptionKey'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from './loginCredentialsSchema'
import {
  AddEncryptedSecretsDocument,
  AddEncryptedSecretsMutation,
  AddEncryptedSecretsMutationVariables,
  MarkAsSyncedDocument,
  MarkAsSyncedMutation,
  MarkAsSyncedMutationVariables,
  SyncEncryptedSecretsDocument,
  SyncEncryptedSecretsQuery,
  SyncEncryptedSecretsQueryVariables
} from '@shared/graphql/ExtensionDevice.codegen'
import {
  IBackgroundStateSerializable,
  ILoginSecret,
  ITOTPSecret,
  SecretSerializedType,
  device,
  AddSecretInput,
  isLoginSecret,
  isTotpSecret,
  getDecryptedSecretProp,
  getTldPart
} from './Device'

export class DeviceState implements IBackgroundStateSerializable {
  decryptedSecrets: (ILoginSecret | ITOTPSecret)[]
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    this.decryptedSecrets = this.getAllSecretsDecrypted()
  }
  email: string
  userId: string
  deviceName: string

  encryptionSalt: string
  masterEncryptionKey: string
  secrets: Array<SecretSerializedType>

  authSecret: string
  authSecretEncrypted!: string

  //Settings
  lockTime: number
  syncTOTP: boolean
  autofill: boolean
  language: string
  theme: string
  biometricsEnabled = false

  //Timer
  lockTimeStart: number
  lockTimeEnd: number
  lockTimerRunning = false

  setMasterEncryptionKey(masterPassword: string) {
    this.masterEncryptionKey = generateEncryptionKey(
      masterPassword,
      this.encryptionSalt
    )
    this.save()
  }

  encrypt(stringToEncrypt: string) {
    return cryptoJS.AES.encrypt(stringToEncrypt, this.masterEncryptionKey, {
      iv: cryptoJS.enc.Utf8.parse(this.userId)
    }).toString()
  }
  decrypt(encrypted: string) {
    return cryptoJS.AES.decrypt(encrypted, this.masterEncryptionKey, {
      iv: cryptoJS.enc.Utf8.parse(this.userId)
    }).toString(cryptoJS.enc.Utf8)
  }

  async save() {
    device.lockedState = null
    this.decryptedSecrets = this.getAllSecretsDecrypted()

    await SInfo.setItem(
      'deviceState',
      JSON.stringify({ backgroundState: this, lockedState: null }),
      {
        sharedPreferencesName: 'mySharedPrefs',
        keychainService: 'myKeychain'
      }
    )
  }

  getSecretDecryptedById(id: string) {
    const secret = this.decryptedSecrets.find((secret) => secret.id === id)
    if (secret) {
      return this.decryptSecret(secret)
    }
  }

  getSecretsDecryptedByHostname(host: string) {
    let secrets = this.decryptedSecrets.filter((secret) => {
      return (
        host === new URL(getDecryptedSecretProp(secret, 'url') ?? '').hostname
      )
    })
    if (secrets.length === 0) {
      secrets = this.decryptedSecrets.filter((secret) =>
        host.endsWith(getTldPart(getDecryptedSecretProp(secret, 'url') ?? ''))
      )
    }
    return secrets.map((secret) => {
      return this.decryptSecret(secret)
    })
  }

  getAllSecretsDecrypted() {
    return this.secrets.map((secret) => {
      return this.decryptSecret(secret)
    })
  }

  private decryptSecret(secret: SecretSerializedType) {
    const decrypted = this.decrypt(secret.encrypted)
    let secretDecrypted: ILoginSecret | ITOTPSecret

    console.log('decrypted', decrypted, typeof decrypted)
    if (secret.kind === EncryptedSecretType.TOTP) {
      secretDecrypted = {
        ...secret,
        totp: JSON.parse(decrypted)
      } as ITOTPSecret
    } else if (secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS) {
      const parsed: {
        iconUrl: null
        label: string
        password: string
        url: string
        username: string
      } = JSON.parse(decrypted)

      try {
        loginCredentialsSchema.parse(parsed)
        secretDecrypted = {
          loginCredentials: parsed,
          ...secret
        } as ILoginSecret
      } catch (err: unknown) {
        secretDecrypted = {
          ...secret,
          loginCredentials: {
            username: '',
            password: '',
            parseError: err as Error,
            label: parsed.label,
            url: parsed.url
          }
        } as ILoginSecret
      }
    } else {
      throw new Error('Unknown secret type')
    }

    return secretDecrypted
  }

  /**
   * fetches newly added/deleted/updated secrets from the backend and updates the device state
   */
  async backendSync() {
    const { data } = await apolloClient.query<
      SyncEncryptedSecretsQuery,
      SyncEncryptedSecretsQueryVariables
    >({
      query: SyncEncryptedSecretsDocument,
      fetchPolicy: 'no-cache'
    })

    if (data) {
      const deviceState = device.state
      if (data && deviceState) {
        const backendRemovedSecrets =
          data.currentDevice.encryptedSecretsToSync.filter(
            ({ deletedAt }) => deletedAt
          )
        const newAndUpdatedSecrets =
          data.currentDevice.encryptedSecretsToSync.filter(
            ({ deletedAt }) => !deletedAt
          )

        const secretsBeforeSync = deviceState.secrets
        const unchangedSecrets = secretsBeforeSync.filter(
          ({ id }) =>
            !backendRemovedSecrets.find(
              (removedSecret) => id === removedSecret.id
            ) &&
            !newAndUpdatedSecrets.find(
              (updatedSecret) => id === updatedSecret.id
            )
        )

        deviceState.secrets = [...unchangedSecrets, ...newAndUpdatedSecrets]

        await this.save()

        await apolloClient.mutate<
          MarkAsSyncedMutation,
          MarkAsSyncedMutationVariables
        >({ mutation: MarkAsSyncedDocument })

        const actuallyRemovedOnThisDevice = backendRemovedSecrets.filter(
          ({ id: removedId }) => {
            return secretsBeforeSync.find(({ id }) => removedId === id)
          }
        )
        console.log(
          '~ actuallyRemovedOnThisDevice',
          actuallyRemovedOnThisDevice
        )
        return {
          removedSecrets: actuallyRemovedOnThisDevice.length,
          newAndUpdatedSecrets: newAndUpdatedSecrets.length
        }
      }
    }
  }

  findExistingSecret(secret) {
    const existingSecretsOnHostname = this.getSecretsDecryptedByHostname(
      new URL(secret.url).hostname
    )

    return existingSecretsOnHostname.find(
      (s) =>
        (isLoginSecret(s) &&
          s.loginCredentials.username === secret.loginCredentials?.username) ||
        (isTotpSecret(s) && s.totp === secret.totp)
    )
  }

  /**
   * invokes the backend mutation and pushes the new secret to the bgState
   * @param secret
   * @returns the added secret
   */
  async addSecrets(secrets: AddSecretInput) {
    // const existingSecret = this.findExistingSecret(secrets)
    // if (existingSecret) {
    //   return null
    // }

    const { data } = await apolloClient.mutate<
      AddEncryptedSecretsMutation,
      AddEncryptedSecretsMutationVariables
    >({
      mutation: AddEncryptedSecretsDocument,
      variables: {
        secrets: secrets.map((secret) => {
          const stringToEncrypt =
            secret.kind === EncryptedSecretType.TOTP
              ? JSON.stringify(secret.totp)
              : JSON.stringify(secret.loginCredentials)

          const encrypted = this.encrypt(stringToEncrypt as string)

          return {
            encrypted,
            kind: secret.kind
          }
        })
      }
    })
    if (!data) {
      throw new Error('failed to save secret')
    }
    console.log('saved secret to the backend', secrets)
    const secretsAdded = data.me.addEncryptedSecrets

    this.secrets.push(...secretsAdded)
    await this.save()
    return secretsAdded
  }

  async removeSecret(secretId: string) {
    this.secrets = this.secrets.filter((s) => s.id !== secretId)
    this.save()
  }
}
