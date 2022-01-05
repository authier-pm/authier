import { useDeviceState } from '@src/util/useDeviceState'
import React, { createContext, FunctionComponent } from 'react'

export const DeviceStateContext = createContext<
  ReturnType<typeof useDeviceState>
>({} as any)

export const DeviceStateProvider: FunctionComponent = ({ children }) => {
  const deviceState = useDeviceState()
  return (
    <DeviceStateContext.Provider value={deviceState}>
      {children}
    </DeviceStateContext.Provider>
  )
}
