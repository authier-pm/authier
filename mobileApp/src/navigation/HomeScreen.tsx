import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Home from '../components/Home';
import Scan from '../components/Scan';
import { AuthList } from '../components/AuthList';
import { IconButton, Icon as NativeIcon } from 'native-base';
import Icon from 'react-native-vector-icons/Ionicons';

//const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function HomeScreen() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: true }}
      initialRouteName="Home"
    >
      <Drawer.Screen
        options={{
          headerLeft: () => (
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
              onPress={() => console.log('Pressed')}
            />
          ),
        }}
        name="Home"
        component={Home}
      />
      <Drawer.Screen name="Scan" component={Scan} />
      <Drawer.Screen
        options={{
          headerStyle: {
            backgroundColor: '#ebebeb',
          },

          headerLeft: () => (
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
              onPress={() => console.log('Pressed')}
            />
          ),
        }}
        name="AuthList"
        component={AuthList}
      />
    </Drawer.Navigator>
  );
}
export default HomeScreen;
