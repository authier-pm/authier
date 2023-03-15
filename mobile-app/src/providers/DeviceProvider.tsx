import React, { createContext, useEffect } from 'react'
import { useForceUpdate } from '../../useForceUpdate'
import { device, Device } from '../utils/Device'

export const DeviceContext = createContext<Device>({} as any)

export const DeviceProvider = ({ children }) => {
  const forceUpdate = useForceUpdate()

  useEffect(() => {
    device.emitter.on('stateChange', () => {
      forceUpdate()
    })
  }, [])

  return (
    <DeviceContext.Provider value={device}>{children}</DeviceContext.Provider>
  )
}
