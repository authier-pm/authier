import * as React from 'react'

import messaging from '@react-native-firebase/messaging'
import DeviceStackNavigation from './DeviceStackNavigation'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import PasswordsStackNavigation from './PasswordsStackNavigation'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AccountNavigation from './AccountNavigation'
import TOTPStackNavigation from './TOTPStackNavigation'

import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from './types'
import { useSyncSettingsQuery } from '@shared/graphql/Settings.codegen'
import { useTestStore } from '@utils/deviceStateStore'
import { useToast } from 'native-base'
import { useStore } from '@src/utils/deviceStore'

const RootStack = createBottomTabNavigator<RootStackParamList>()

function AppNavigation() {
  const { data } = useSyncSettingsQuery({
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  })
  const device = useStore((state) => state)
  const deviceState = useTestStore((state) => state)
  const navigation = useNavigation()
  const toast = useToast()

  React.useEffect(() => {
    // Assume a message-notification contains a "type" property in the data payload of the screen to open
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification
      )

      // @ts-expect-error
      navigation.navigate(remoteMessage.data.type)
    })

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.data!.type
          )
          // @ts-expect-error
          navigation.navigate(remoteMessage.data!.type)
        }
      })

    if (deviceState) {
      deviceState.backendSync(toast)
    }
    if (data && data.currentDevice) {
      device.setDeviceSettings({
        autofillTOTPEnabled: data.me.autofillTOTPEnabled,
        autofillCredentialsEnabled: data.me.autofillCredentialsEnabled,
        syncTOTP: data.currentDevice.syncTOTP,
        vaultLockTimeoutSeconds: data.currentDevice
          .vaultLockTimeoutSeconds as number,
        uiLanguage: data.me.uiLanguage
      })
    }
  }, [])

  return (
    <RootStack.Navigator
      initialRouteName={'Passwords'}
      screenOptions={({ route }) => ({
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: ({ focused, color, size }) => {
          // Make this questionMark or something
          let iconName = 'key'

          if (route.name === 'Passwords') {
            iconName = focused ? 'key' : 'key-outline'
          } else if (route.name === 'Devices') {
            iconName = focused ? 'phone-portrait' : 'phone-portrait-outline'
          } else if (route.name === 'TOTP') {
            iconName = focused ? 'reader' : 'reader-outline'
          } else if (route.name === 'User') {
            iconName = focused ? 'person' : 'person-outline'
          }

          // You can return any component that you like here!
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#00a8ff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarHideOnKeyboard: true
      })}
    >
      <RootStack.Screen name="Passwords" component={PasswordsStackNavigation} />
      <RootStack.Screen name="TOTP" component={TOTPStackNavigation} />
      <RootStack.Screen name="Devices" component={DeviceStackNavigation} />
      <RootStack.Screen name="User" component={AccountNavigation} />
    </RootStack.Navigator>
  )
}
export default AppNavigation
