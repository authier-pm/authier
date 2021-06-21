import React, { createRef, RefObject, useContext, useState } from 'react';
import {
  Easing,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import OTP from 'otp-client';
import { AuthsContext } from '../Providers';
import { Colors } from 'react-native/Libraries/NewAppScreen';
//import { AnimatedCircularProgress } from 'react-native-circular-progress';

// const Section: React.FC<{
//   title: string;
// }> = ({ children, title }) => {
//   const isDarkMode = useColorScheme() === 'dark';
//   return (
//     <View style={styles.sectionContainer}>
//       <Text
//         style={[
//           styles.sectionTitle,
//           {
//             color: isDarkMode ? Colors.white : Colors.black,
//           },
//         ]}
//       >
//         {title}
//       </Text>
//       <Text
//         style={[
//           styles.sectionDescription,
//           {
//             color: isDarkMode ? Colors.light : Colors.dark,
//           },
//         ]}
//       >
//         {children}
//       </Text>
//     </View>
//   );
// };

interface Item {
  secret: string;
  label: string;
  icon: string;
}

const options = {
  algorithm: 'sha1',
  digits: 6,
};

export const AuthList = (): JSX.Element => {
  const { auths } = useContext(AuthsContext);

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [seconds, setRemainingSeconds] = useState(0); // render some other way??

  const ListItem = ({ item }) => {
    const otp = new OTP(item.secret, options);

    setInterval(() => {
      setRemainingSeconds(otp.getTimeUntilNextTick());
    }, 1000);

    return (
      <View style={styles.item}>
        <View style={styles.flexBox}>
          <Text>{otp.getToken()}</Text>
          <Text>{item.label}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, backgroundStyle]}>
      <FlatList
        data={auths}
        keyExtractor={(auth) => auth.label}
        renderItem={ListItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
  },
  flexBox: {
    display: 'flex',
    flexDirection: 'column',
  },
});
