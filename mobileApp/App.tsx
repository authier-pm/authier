/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */
import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { Providers } from './src/Providers';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  async function requestUserPermission() {
    //const token = await messaging().getToken();
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
  }

  useEffect(() => {
    requestUserPermission();
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      let data = JSON.stringify(remoteMessage);
      await AsyncStorage.setItem('notifies', data, (e) => {
        if (e) console.log(e);
      });
    });

    return unsubscribe;
  }, []);

  return <Providers />;
};

export default App;
