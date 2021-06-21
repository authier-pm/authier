import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../components/Home';
import Icon from 'react-native-vector-icons/Ionicons';
import Scan from '../components/Scan';
import { AuthList } from '../components/AuthList';

const Tab = createBottomTabNavigator();

function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan';
          } else if (route.name === 'AuthList') {
            iconName = focused ? 'list' : 'list';
          }

          // You can return any component that you like here!
          return <Icon name={iconName as string} size={size} color={color} />;
        },
      })}
      tabBarOptions={{
        activeTintColor: 'tomato',
        inactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen options={{}} name="Scan" component={Scan} />
      <Tab.Screen options={{}} name="AuthList" component={AuthList} />
    </Tab.Navigator>
  );
}
export default HomeScreen;
