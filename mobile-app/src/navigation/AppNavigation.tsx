import * as React from 'react'

import messaging from '@react-native-firebase/messaging'
import DeviceStackNavigation from './DeviceStackNavigation'

import {
  BottomTabBar,
  createBottomTabNavigator
} from '@react-navigation/bottom-tabs'
import PasswordsStackNavigation from './PasswordsStackNavigation'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AccountNavigation from './AccountNavigation'
import TOTPStackNavigation from './TOTPStackNavigation'

import { useNavigation } from '@react-navigation/native'
import { RootStackParamList } from './types'
import { useToast } from 'native-base'
import { useDeviceStore } from '@src/utils/deviceStore'
import { useDeviceStateStore } from '@utils/deviceStateStore'
import { Platform } from 'react-native'
import { OfflineBanner } from '@src/components/OfflineBanner'

const RootStack = createBottomTabNavigator<RootStackParamList>()

function AppNavigation() {
  const [updateDeviceSettings] = useDeviceStore((state) => [
    state.updateDeviceSettings
  ])
  const [notifications, backendSync, setNotifications] = useDeviceStateStore(
    (state) => [state.notifications, state.backendSync, state.setNotifications]
  )
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

    // Foreground notification
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      if (remoteMessage.data.type === 'Devices') {
        setNotifications(notifications + 1)
      }
    })

    backendSync(toast)
    return unsubscribe
  }, [])

  React.useEffect(() => {
    updateDeviceSettings()
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
        tabBarActiveTintColor: '#4CE0D2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarHideOnKeyboard: true
      })}
      tabBar={(props) => (
        <>
          <OfflineBanner />
          <BottomTabBar {...props} />
        </>
      )}
    >
      <RootStack.Screen name="Passwords" component={PasswordsStackNavigation} />
      <RootStack.Screen name="TOTP" component={TOTPStackNavigation} />
      <RootStack.Screen
        options={
          notifications > 0
            ? {
                tabBarBadge: notifications,
                tabBarBadgeStyle: {
                  top: Platform.OS === 'ios' ? 0 : 9,
                  minWidth: 14,
                  maxHeight: 14,
                  borderRadius: 7,
                  fontSize: 10,
                  lineHeight: 13
                }
              }
            : {}
        }
        name="Devices"
        component={DeviceStackNavigation}
      />
      <RootStack.Screen name="User" component={AccountNavigation} />
    </RootStack.Navigator>
  )
}
export default AppNavigation
