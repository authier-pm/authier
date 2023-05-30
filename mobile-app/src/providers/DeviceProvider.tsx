// import { useSyncSettingsQuery } from '@shared/graphql/Settings.codegen'
// import { useToast } from 'native-base'
// import React, { createContext, useEffect, useRef } from 'react'
// import { useForceUpdate } from '../../useForceUpdate'
// import { device, Device } from '../utils/Device'
// import { DeviceStore, createDeviceStore } from '@src/utils/deviceStore'
//
// // export const DeviceContext = createContext<Device>({} as any)
// export const DeviceContext = createContext<DeviceStore | null>(null)
//
// export const DeviceProvider = ({ children }) => {
//   const store = useRef(createDeviceStore()).current
//   const [forceUpdate, value] = useForceUpdate()
//   const toast = useToast()
//
//   // const { data } = useSyncSettingsQuery({
//   //   fetchPolicy: 'cache-and-network',
//   //   nextFetchPolicy: 'cache-first'
//   // })
//   //
//   // useEffect(() => {
//   //   device.emitter.on('stateChange', () => {
//   //     console.log('force update')
//   //     forceUpdate()
//   //   })
//   //
//   //   if (data && data.me && data.currentDevice) {
//   //     device.setDeviceSettings({
//   //       autofillTOTPEnabled: data.me.autofillTOTPEnabled,
//   //       autofillCredentialsEnabled: data.me.autofillCredentialsEnabled,
//   //       syncTOTP: data.currentDevice.syncTOTP,
//   //       vaultLockTimeoutSeconds: data.currentDevice
//   //         .vaultLockTimeoutSeconds as number,
//   //       uiLanguage: data.me.uiLanguage
//   //     })
//   //     if (device.state) {
//   //       device.state.backendSync(toast)
//   //     }
//   //   }
//   // }, [])
//
//   return (
//     <DeviceContext.Provider value={store} key={value}>
//       {children}
//     </DeviceContext.Provider>
//   )
// }
