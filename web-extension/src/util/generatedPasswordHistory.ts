import browser from 'webextension-polyfill'
import { z } from 'zod'
import { constructURL } from '@shared/urlUtils'

export const GENERATED_PASSWORD_HISTORY_STORAGE_KEY =
  'generatedPasswordHistory'

const generatedPasswordHistoryEntrySchema = z.object({
  id: z.string().min(1),
  password: z.string().min(1),
  pageUrl: z.string().min(1),
  hostname: z.string().min(1),
  createdAt: z.string().datetime()
})

const generatedPasswordHistorySchema = z.array(
  generatedPasswordHistoryEntrySchema
)

export type GeneratedPasswordHistoryEntry = z.infer<
  typeof generatedPasswordHistoryEntrySchema
>

const sortGeneratedPasswordHistory = (
  entries: GeneratedPasswordHistoryEntry[]
) => {
  return [...entries].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

const createGeneratedPasswordHistoryId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return `generated-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const normalizeHistoryHostname = (urlOrHostname: string) => {
  return constructURL(urlOrHostname).hostname ?? urlOrHostname
}

export const createGeneratedPasswordHistoryEntry = ({
  createdAt = new Date().toISOString(),
  pageUrl,
  password
}: {
  createdAt?: string
  pageUrl: string
  password: string
}): GeneratedPasswordHistoryEntry => {
  return generatedPasswordHistoryEntrySchema.parse({
    id: createGeneratedPasswordHistoryId(),
    password,
    pageUrl,
    hostname: normalizeHistoryHostname(pageUrl),
    createdAt
  })
}

export const getGeneratedPasswordHistory = async () => {
  const storage = await browser.storage.local.get(
    GENERATED_PASSWORD_HISTORY_STORAGE_KEY
  )
  const entries = generatedPasswordHistorySchema.parse(
    storage[GENERATED_PASSWORD_HISTORY_STORAGE_KEY] ?? []
  )

  return sortGeneratedPasswordHistory(entries)
}

export const appendGeneratedPasswordHistoryEntry = async (
  entry: GeneratedPasswordHistoryEntry
) => {
  const currentHistory = await getGeneratedPasswordHistory()
  const nextHistory = sortGeneratedPasswordHistory([entry, ...currentHistory])

  await browser.storage.local.set({
    [GENERATED_PASSWORD_HISTORY_STORAGE_KEY]: nextHistory
  })

  return nextHistory
}

export const clearGeneratedPasswordHistory = async () => {
  await browser.storage.local.remove(GENERATED_PASSWORD_HISTORY_STORAGE_KEY)
}
