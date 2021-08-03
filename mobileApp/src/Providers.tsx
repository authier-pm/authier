import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
} from 'react';
import { ApolloProvider } from '@apollo/client';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './navigation/HomeScreen';
import { apoloCLient } from './ApolloClient';
import TokenProvider from './TokenProvider';
import { NativeBaseProvider } from 'native-base';
import { theme } from './Theme';
import NotifyProvider from './NotifyProvider';

export const AuthsContext = createContext<{
  auths: Array<any>;
  setAuths: Dispatch<
    SetStateAction<{ secret: string; label: string; icon: string }[]>
  >;
}>({ auths: [] } as any);

export const Providers: React.FC<{}> = () => {
  const [auths, setAuths] = useState([
    {
      secret: 'JBSWY3DPEHPK3PXP',
      label: 'bitfinex',
      icon: 'https://chakra-ui.com/favicon.png',
    },
  ]);

  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme}>
        <ApolloProvider client={apoloCLient}>
          <NotifyProvider>
            <AuthsContext.Provider value={{ auths, setAuths }}>
              <TokenProvider>
                <NavigationContainer>
                  <HomeScreen />
                </NavigationContainer>
              </TokenProvider>
            </AuthsContext.Provider>
          </NotifyProvider>
        </ApolloProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
};
