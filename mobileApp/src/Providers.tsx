import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useState,
} from 'react';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from './navigation/HomeScreen';

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
    <AuthsContext.Provider value={{ auths, setAuths }}>
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    </AuthsContext.Provider>
  );
};
