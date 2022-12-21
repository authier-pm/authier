import React, { createContext } from 'react'
import { useForceUpdate } from '../../useForceUpdate'
import { device, Device } from '../utils/Device'

export const DeviceContext = createContext<Device>({} as any)

export const DeviceProvider = ({ children }) => {
  const forceUpdate = useForceUpdate()

  if (!device.fireToken) {
    device.initializePromise.then(() => {
      forceUpdate()
    })
    return null
  }

  return (
    <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
  )
}
