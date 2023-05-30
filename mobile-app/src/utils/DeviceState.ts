import { apolloClient } from '../apollo/ApolloClient'
import {
  abToCryptoKey,
  base64ToBuffer,
  bufferToBase64,
  cryptoKeyToString,
  dec,
  enc,
  generateEncryptionKey
} from '@utils/generateEncryptionKey'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { loginCredentialsSchema } from '@shared/loginCredentialsSchema'

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
  getDecryptedSecretProp
} from './Device'

import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { setSensitiveItem } from './secretStorage'
import { IToastService } from 'native-base/lib/typescript/components/composites/Toast'

export class DeviceState implements IBackgroundStateSerializable {
  decryptedSecrets: (ILoginSecret | ITOTPSecret)[] = []
  constructor(parameters: IBackgroundStateSerializable) {
    Object.assign(this, parameters)
    this.initialize()
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
  autofillCredentialsEnabled: boolean
  autofillTOTPEnabled: boolean
  uiLanguage: string
  theme: string
  biometricsEnabled = false

  //Timer
  lockTimeStart: number
  lockTimeEnd: number
  lockTimerRunning = false

  async initialize() {
    this.decryptedSecrets = await this.getAllSecretsDecrypted()
  }

  async setMasterEncryptionKey(masterPassword: string) {
    const key = await generateEncryptionKey(
      masterPassword,
      base64ToBuffer(this.encryptionSalt)
    )
    this.masterEncryptionKey = await cryptoKeyToString(key)
    this.save()
  }

  async encrypt(stringToEncrypt: string): Promise<string> {
    const cryptoKey = await abToCryptoKey(
      base64ToBuffer(this.masterEncryptionKey)
    )
    const iv = self.crypto.getRandomValues(new Uint8Array(12))
    const salt = base64ToBuffer(this.encryptionSalt)

    const encrypted = await self.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(stringToEncrypt)
    )

    const encryptedContentArr = new Uint8Array(encrypted)
    const buff = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
    )
    buff.set(salt, 0)
    buff.set(iv, salt.byteLength)
    buff.set(encryptedContentArr, salt.byteLength + iv.byteLength)
    const base64Buff = bufferToBase64(buff)

    return base64Buff
  }

  /**
   * @param encrypted in base64
   * @returns pure string
   */
  async decrypt(encrypted: string): Promise<string> {
    const cryptoKey = await abToCryptoKey(
      base64ToBuffer(this.masterEncryptionKey)
    )
    const encryptedDataBuff = base64ToBuffer(encrypted)
    const iv = encryptedDataBuff.slice(16, 16 + 12)
    const data = encryptedDataBuff.slice(16 + 12)

    const decrypted = await self.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    )

    return dec.decode(decrypted)
  }

  async save() {
    device.lockedState = null
    this.decryptedSecrets = await this.getAllSecretsDecrypted()

    await setSensitiveItem('deviceState', {
      backgroundState: this,
      lockedState: null
    })

    device.emitter.emit('stateChange')
  }

  getSecretDecryptedById(id: string) {
    const secret = this.decryptedSecrets.find((secret) => secret.id === id)
    if (secret) {
      return this.decryptSecret(secret)
    }
    return undefined
  }

  getSecretsDecryptedByHostname(host: string) {
    let secrets = this.decryptedSecrets.filter((secret) => {
      return (
        host === new URL(getDecryptedSecretProp(secret, 'url') ?? '').hostname
      )
    })
    if (secrets.length === 0) {
      secrets = this.decryptedSecrets.filter((secret) =>
        host.endsWith(
          getDomainNameAndTldFromUrl(
            getDecryptedSecretProp(secret, 'url') ?? ''
          )
        )
      )
    }
    return Promise.all(
      secrets.map((secret) => {
        return this.decryptSecret(secret)
      })
    )
  }

  getAllSecretsDecrypted() {
    return Promise.all(
      this.secrets.map((secret) => {
        return this.decryptSecret(secret)
      })
    )
  }

  private async decryptSecret(secret: SecretSerializedType) {
    const decrypted = await this.decrypt(secret.encrypted)
    let secretDecrypted: ILoginSecret | ITOTPSecret

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
  async backendSync(toast: IToastService) {
    console.log('backendSync:')
    const { data } = await apolloClient.query<
      SyncEncryptedSecretsQuery,
      SyncEncryptedSecretsQueryVariables
    >({
      query: SyncEncryptedSecretsDocument,
      fetchPolicy: 'network-only'
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

        const res = {
          removedSecrets: actuallyRemovedOnThisDevice.length,
          newAndUpdatedSecrets: newAndUpdatedSecrets.length
        }
        console.log('res:', res)

        if (
          (res?.newAndUpdatedSecrets as number) > 0 ||
          (res?.removedSecrets as number) > 0
        ) {
          toast.show({
            title: 'Vault synced',
            description: `Sync successful, added/updated ${res?.newAndUpdatedSecrets}, removed ${res?.removedSecrets}`
          })
        } else {
          toast.show({
            title: 'Vault synced'
          })
        }

        return res
      }
    }
  }

  async findExistingSecret(secret) {
    const existingSecretsOnHostname = await this.getSecretsDecryptedByHostname(
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
    const encryptedSecrets = await Promise.all(
      secrets.map(async (secret) => {
        const stringToEncrypt =
          secret.kind === EncryptedSecretType.TOTP
            ? JSON.stringify(secret.totp)
            : JSON.stringify(secret.loginCredentials)

        const encrypted = await this.encrypt(stringToEncrypt)

        return {
          encrypted,
          kind: secret.kind
        }
      })
    )

    const { data } = await apolloClient.mutate<
      AddEncryptedSecretsMutation,
      AddEncryptedSecretsMutationVariables
    >({
      mutation: AddEncryptedSecretsDocument,
      variables: {
        secrets: encryptedSecrets
      },
      refetchQueries: [{ query: SyncEncryptedSecretsDocument }]
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
