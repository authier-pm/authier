import { z } from 'zod'
import browser from 'webextension-polyfill'
import { clearAutofillPageState } from './autofillPageState'
import { vaultLockMessage } from '../util/vaultLockMessage'
import { AutofillPagePauseMessageKind } from './autofillPagePause'

const identitySchema = z.object({
  userId: z.string(),
  masterEncryptionKey: z.string(),
  authSecretEncrypted: z.string()
})

export const invalidatesAutofill = ({
  oldValue,
  newValue
}: browser.Storage.StorageChange) => {
  if (!newValue) return true
  if (!oldValue) return false
  const previous = identitySchema.safeParse(oldValue)
  const current = identitySchema.safeParse(newValue)
  return (
    !previous.success ||
    !current.success ||
    previous.data.userId !== current.data.userId ||
    previous.data.masterEncryptionKey !== current.data.masterEncryptionKey ||
    previous.data.authSecretEncrypted !== current.data.authSecretEncrypted
  )
}

export const invalidateAutofillInTabs = async () => {
  clearAutofillPageState()
  await broadcastToTabs(vaultLockMessage)
}

export const synchronizeAutofillSession = async (
  change: browser.Storage.StorageChange
) => {
  const invalidated = invalidatesAutofill(change)
  if (invalidated) await invalidateAutofillInTabs()
  if (change.newValue && (!change.oldValue || invalidated))
    await broadcastToTabs({ kind: AutofillPagePauseMessageKind.REFRESH })
}

const broadcastToTabs = async (message: { kind: string }) => {
  const tabs = await browser.tabs.query({})
  await Promise.all(
    tabs.map((tab) => {
      if (tab.id === undefined) return undefined
      // No frameId means every injected frame; closed/uninjectable tabs are benign.
      return browser.tabs.sendMessage(tab.id, message).catch(() => undefined)
    })
  )
}
