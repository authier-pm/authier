import * as React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import Home from '../screens/Home'
import Scan from '../screens/Scan'
import { Vault } from '../screens/Vault'
import { IconButton, Icon as NativeIcon } from 'native-base'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'

//const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator()

function HomeScreen() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerLeft: () => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const navigation = useNavigation()
          return (
            <IconButton
              ml={3}
              variant="ghost"
              icon={
                <NativeIcon
                  color="#636363"
                  size="sm"
                  as={<Icon name="settings-outline" />}
                />
              }
              //@ts-expect-error
              onPress={() => navigation.openDrawer()}
            />
          )
        }
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Scan" component={Scan} />
      <Drawer.Screen
        options={({}) => ({
          headerStyle: {
            backgroundColor: '#ebebeb'
          },
          headerName: false
        })}
        name="My Vault"
        component={Vault}
      />
    </Drawer.Navigator>
  )
}
export default HomeScreen
