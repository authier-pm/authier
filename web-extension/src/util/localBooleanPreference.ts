import browser from 'webextension-polyfill'

export const localBooleanPreference = (key: string, defaultValue: boolean) => {
  const read = async (): Promise<boolean | undefined> => {
    const storage = await browser.storage.local.get(key)
    return typeof storage[key] === 'boolean' ? storage[key] : undefined
  }
  const set = async (value: boolean): Promise<void> => {
    await browser.storage.local.set({ [key]: value })
  }
  return {
    async get(): Promise<boolean> {
      return (await read()) ?? defaultValue
    },
    set,
    async initialize(value: boolean): Promise<void> {
      if ((await read()) === undefined) await set(value)
    }
  }
}
