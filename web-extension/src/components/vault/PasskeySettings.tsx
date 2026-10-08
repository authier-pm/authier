import { useUpdateEncryptedSecretMutation } from '@shared/graphql/EncryptedSecrets.codegen'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { passkeySchema } from '@shared/passkeySchema'
import { device } from '@src/background/ExtensionDevice'
import type { IPasskeySecret } from '@src/util/useDeviceState'
import { DeleteSecretButton } from './DeleteSecretButton'
import { PasskeyDetailCard } from './PasskeyDetailCard'

export function PasskeySettings({ secret }: { secret: IPasskeySecret }) {
  const [updateSecret] = useUpdateEncryptedSecretMutation()

  const saveLabel = async (label: string) => {
    const state = device.state
    if (!state) throw new Error('Unlock your vault to edit this passkey.')
    const stored = state.secrets.find(({ id }) => id === secret.id)
    if (!stored) throw new Error('This passkey is no longer in your vault.')
    if (stored.kind !== EncryptedSecretType.PASSKEY) {
      throw new Error('This item is no longer a passkey.')
    }
    const current = passkeySchema.parse(
      JSON.parse(await state.decrypt(stored.encrypted))
    )
    const encrypted = await state.encrypt(JSON.stringify({ ...current, label }))
    if (device.state !== state) {
      throw new Error(
        'Your vault session changed. Reopen the passkey to edit it.'
      )
    }
    const result = await updateSecret({
      variables: {
        id: secret.id,
        patch: { encrypted, kind: EncryptedSecretType.PASSKEY }
      }
    })
    if (result.data?.me?.encryptedSecret?.update?.id !== secret.id) {
      throw new Error('The passkey could not be saved. Please try again.')
    }
    if (device.state !== state) {
      throw new Error(
        'Your vault session changed. Reopen the passkey to continue.'
      )
    }
    stored.encrypted = encrypted
    await state.save()
  }

  return (
    <PasskeyDetailCard passkey={secret.passkey} onSaveLabel={saveLabel}>
      <DeleteSecretButton secrets={[secret]}>Delete passkey</DeleteSecretButton>
    </PasskeyDetailCard>
  )
}
