import { useEffect } from 'react'

import messaging from '@react-native-firebase/messaging'
import { DeviceStackNavigation } from './DeviceStackNavigation'

import {
  BottomTabBar,
  createBottomTabNavigator
} from '@react-navigation/bottom-tabs'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { AccountNavigation } from './AccountNavigation'
import { PasswordsStackNavigation } from './PasswordsStackNavigation'
import { TOTPStackNavigation } from './TOTPStackNavigation'

import { t } from '@lingui/core/macro'
import { useNavigation } from '@react-navigation/native'
import { useToast } from 'native-base'
import { Platform } from 'react-native'
import { OfflineBanner } from '../components/OfflineBanner'
import { useDeviceStateStore } from '../utils/deviceStateStore'
import { useDeviceStore } from '../utils/deviceStore'
import { RootStackParamList } from './types'

const RootStack = createBottomTabNavigator<RootStackParamList>()

export function AppNavigation() {
  const [updateDeviceSettings] = useDeviceStore((state) => [
    state.updateDeviceSettings
  ])
  const [notifications, backendSync, setNotifications] = useDeviceStateStore(
    (state) => [state.notifications, state.backendSync, state.setNotifications]
  )
  const navigation = useNavigation()
  const toast = useToast()

  useEffect(() => {
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
    updateDeviceSettings()
    return unsubscribe
  }, [])

  return (
    <>
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
        <RootStack.Screen
          name="Passwords"
          options={{
            title: t`Passwords`
          }}
          component={PasswordsStackNavigation}
        />
        <RootStack.Screen name="TOTP" component={TOTPStackNavigation} />
        <RootStack.Screen
          options={
            notifications > 0
              ? {
                  tabBarBadge: notifications,
                  title: t`Devices`,
                  tabBarBadgeStyle: {
                    top: Platform.OS === 'ios' ? 0 : 9,
                    minWidth: 14,
                    maxHeight: 14,
                    borderRadius: 7,
                    fontSize: 10,
                    lineHeight: 13
                  }
                }
              : { title: t`Devices` }
          }
          name="Devices"
          component={DeviceStackNavigation}
        />
        <RootStack.Screen
          name="User"
          options={{
            title: t`Devices`
          }}
          component={AccountNavigation}
        />
      </RootStack.Navigator>
    </>
  )
}
