import debug from 'debug'
import browser from 'webextension-polyfill'
import Bowser from 'bowser'
import cryptoJS from 'crypto-js'
import { BackgroundMessageType } from './BackgroundMessageType'
import { removeToken } from '@src/util/accessTokenExtension'
import { renderPopup } from '..'

export const log = debug('au:Device')

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min) //The maximum is exclusive and the minimum is inclusive
}

const browserInfo = Bowser.getParser(navigator.userAgent)

class ExtensionDevice {
  generateDeviceName(): string {
    return `${browserInfo.getOSName()} ${browserInfo.getBrowserName()} extension`
  }

  async clearLocalStorage() {
    const deviceId = await this.getDeviceId()
    await browser.storage.local.clear()
    await browser.storage.local.set({ deviceId: deviceId }) // restore deviceId so that we keep it even after logout
  }
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

  getAddDeviceSecretAuthTuple(masterPassword: string, userId: string) {
    const addDeviceSecret = this.generateAddDeviceSecret()

    const addDeviceSecretEncrypted = cryptoJS.AES.encrypt(
      addDeviceSecret,
      masterPassword,
      {
        iv: cryptoJS.enc.Utf8.parse(userId)
      }
    ).toString()
    return {
      addDeviceSecret,
      addDeviceSecretEncrypted
    }
  }

  async logout() {
    await removeToken()
    await device.clearLocalStorage()
    browser.runtime.sendMessage({
      action: BackgroundMessageType.clear
    })

    renderPopup()
  }
}

export const device = new ExtensionDevice()
