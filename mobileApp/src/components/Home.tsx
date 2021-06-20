import React, { useContext, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import OTP from 'otp-client';
//import { authenticator } from 'otplib';
import { AuthsContext } from '../Providers';
import { Colors } from 'react-native/Libraries/NewAppScreen';

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

const options = {
  algorithm: 'sha1',
  digits: 6,
};

const Home = () => {
  const { auths } = useContext(AuthsContext);

  const [seconds, setRemainingSeconds] = useState(0);

  const RenderBox = ({ item }) => {
    const otp = new OTP(item.secret, options);

    setInterval(() => {
      setRemainingSeconds(otp.getTimeUntilNextTick());
    }, 1000);

    return (
      <View>
        <Text>{item.label}</Text>
        <Text>{otp.getToken()}</Text>
      </View>
    );
  };

  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  console.log(auths);
  return (
    <View>
      <FlatList
        data={auths}
        keyExtractor={(auth) => auth.label}
        renderItem={RenderBox}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default Home;
