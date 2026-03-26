const DEVICE_ID_STORAGE_KEY = 'authier-vault-device-id'

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string
  }
}

const readPlatform = () =>
  (navigator as NavigatorWithUserAgentData).userAgentData?.platform ||
  navigator.platform ||
  'Web'

const readBrowser = () => {
  const agent = navigator.userAgent

  if (agent.includes('Firefox')) return 'Firefox'
  if (agent.includes('Edg')) return 'Edge'
  if (agent.includes('Chrome')) return 'Chrome'
  if (agent.includes('Safari')) return 'Safari'

  return 'Browser'
}

export type DeviceIdentity = {
  id: string
  name: string
  platform: string
}

export const getOrCreateDeviceIdentity = (): DeviceIdentity => {
  const existingId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  const id = existingId ?? crypto.randomUUID()

  if (!existingId) {
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, id)
  }

  const platform = readPlatform()

  return {
    id,
    platform,
    name: `${platform} ${readBrowser()} vault`
  }
}
