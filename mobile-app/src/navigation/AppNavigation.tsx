import * as React from 'react'

import messaging from '@react-native-firebase/messaging'
import DeviceStackNavigation from './DeviceStackNavigation'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import PasswordsStackNavigation from './PasswordsStackNavigation'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AccountNavigation from './AccountNavigation'
import TOTPStackNavigation from './TOTPStackNavigation'
import { DeviceContext } from '../providers/DeviceProvider'
import { useSyncSettingsQuery } from '@shared/graphql/Settings.codegen'
import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from './types'
import { Loading } from '@src/components/Loading'
import { useToast } from 'native-base'

const RootStack = createBottomTabNavigator<RootStackParamList>()

function AppNavigation() {
  const device = React.useContext(DeviceContext)
  const { data } = useSyncSettingsQuery({
    fetchPolicy: 'cache-and-network'
  })
  const toast = useToast()

  const navigation = useNavigation()
  const [loading, setLoading] = React.useState(true)
  const [initialRoute, setInitialRoute] = React.useState('Passwords')

  //TODO: I think this is not ideal, but it works for now
  React.useEffect(() => {
    ;(async () => {
      if (data) {
        device.setDeviceSettings({
          autofillTOTPEnabled: data.me?.autofillTOTPEnabled,
          autofillCredentialsEnabled: data.me.autofillCredentialsEnabled,
          syncTOTP: data.currentDevice.syncTOTP,
          vaultLockTimeoutSeconds: data.currentDevice
            .vaultLockTimeoutSeconds as number,
          uiLanguage: data.me.uiLanguage
        })
      }

      await device.state?.backendSync(toast)
    })()
  }, [data])

  React.useEffect(() => {
    // Assume a message-notification contains a "type" property in the data payload of the screen to open
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification
      )

      //@ts-ignore
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
          setInitialRoute(remoteMessage.data!.type)
        }
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <Loading />
  }

  return (
    <RootStack.Navigator
      //@ts-expect-error
      initialRouteName={initialRoute}
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
        headerShown: false
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
