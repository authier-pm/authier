import debug from 'debug'
import browser from 'webextension-polyfill'

export const log = debug('au:Device')

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

class Device {
  /**
   * @returns a stored deviceId or a new UUID if the extension was just installed
   */
  async getDeviceId() {
    const storage = await browser.storage.local.get('deviceId')
    if (!storage.deviceId) {
      // @ts-expect-error
      const deviceId = crypto.randomUUID()
      browser.storage.local.set({ deviceId: deviceId })
      log('deviceId', deviceId)
      return deviceId
    } else {
      log('deviceId', storage.deviceId)
      return storage.deviceId
    }
  }

  generateAddDeviceSecret() {
    const lengthMultiplier = getRandomInt(1, 10)
    let secret = ''
    for (let i = 0; i < lengthMultiplier; i++) {
      secret += Math.random().toString(36).substr(2, 20)
    }
    return secret
  }
}

export const device = new Device()
