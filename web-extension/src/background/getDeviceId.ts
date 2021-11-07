import debug from 'debug'
import browser from 'webextension-polyfill'

export const log = debug('au:backgroundPage')

/**
 * @returns a stored deviceId or a new UUID if the extension was just installed
 */
export const getDeviceId = async () => {
  const storage = await browser.storage.local.get('deviceId')
  if (!storage.deviceId) {
    // @ts-expect-error
    const deviceId = crypto.randomUUID()
    browser.storage.local.set({ deviceId: deviceId })
    log('deviceId', deviceId)
    return deviceId
  } else {
    log('deviceId', storage.deviceId)
    return storage.deviceIds
  }
}
