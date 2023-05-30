import { useDeviceState } from '@src/util/useDeviceState'
import { createContext } from 'react'

export const DeviceStateContext = createContext<
  ReturnType<typeof useDeviceState>
>({} as any)

export const DeviceStateProvider = ({
  children
}: {
  children: JSX.Element
}) => {
  const deviceState = useDeviceState()
  return (
    <DeviceStateContext.Provider value={deviceState}>
      {children}
    </DeviceStateContext.Provider>
  )
}
