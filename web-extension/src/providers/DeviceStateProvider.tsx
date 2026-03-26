import { useDeviceState } from '@src/util/useDeviceState'
import { createContext, type PropsWithChildren } from 'react'

export const DeviceStateContext = createContext<
  ReturnType<typeof useDeviceState>
>({} as any)

export const DeviceStateProvider = ({ children }: PropsWithChildren) => {
  const deviceState = useDeviceState()
  return (
    <DeviceStateContext.Provider value={deviceState}>
      {children}
    </DeviceStateContext.Provider>
  )
}
