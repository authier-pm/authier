import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
} from 'react';
import {
  ApolloClient,
  ApolloProvider,
  NormalizedCacheObject,
} from '@apollo/client';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from './navigation/HomeScreen';
import { apoloCLient } from './ApolloClient';

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
    <ApolloProvider
      client={apoloCLient as unknown as ApolloClient<NormalizedCacheObject>} //WTF IS THIS
    >
      <AuthsContext.Provider value={{ auths, setAuths }}>
        <NavigationContainer>
          <HomeScreen />
        </NavigationContainer>
      </AuthsContext.Provider>
    </ApolloProvider>
  );
};
