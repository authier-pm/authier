import React, { useContext, useState } from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import OTP from 'otp-client';
import { AuthsContext } from '../Providers';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import {
  Box,
  FlatList,
  Icon as NativeIcon,
  IconButton,
  View,
  Text,
  Button,
  Pressable,
  AddIcon,
  Avatar,
  Flex,
  Heading,
  CircularProgress,
} from 'native-base';
import Icon from 'react-native-vector-icons/Ionicons';

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

  const [seconds, setRemainingSeconds] = useState(0);

  const ListItem = ({ item }) => {
    const otp = new OTP(item.secret, options);

    setInterval(() => {
      setRemainingSeconds(otp.getTimeUntilNextTick());
    }, 1000);

    return (
      <View
        backgroundColor="#ffffff"
        p={9}
        flexDirection="row"
        borderBottomWidth={0.5}
        borderBottomRadius={25}
        borderBottomColor="#a7a7a7"
        justifyContent="space-between"
      >
        <Flex>
          <Avatar
            size="lg"
            source={{
              uri: 'https://via.placeholder.com/150',
            }}
          >
            NB
          </Avatar>
        </Flex>
        <Flex flexDirection="column">
          <Text fontSize={20}>{item.label}</Text>
          <Text>nick name</Text>
          <Flex flexDirection="row" alignItems="center">
            <Text fontSize={35}>{otp.getToken()}</Text>
            <NativeIcon
              color="red"
              size="sm"
              as={<Icon name="copy-outline" />}
            />
          </Flex>
        </Flex>
        <IconButton
          alignSelf="flex-start"
          variant="unstyled"
          icon={
            <NativeIcon
              color="#949090"
              size="sm"
              as={<Icon name="ellipsis-vertical-outline" />}
            />
          }
          onPress={() => console.log('Pressed')}
        />
      </View>
    );
  };

  return (
    <View flex={1} safeArea backgroundColor="white">
      <Flex flexDirection="row" justifyContent="space-between">
        <Heading pl={5} pt={5}>
          Your tokens
        </Heading>
        <CircularProgress
          margin={5}
          mt={6}
          value={seconds}
          size={8}
          min={0}
          max={30}
          thickness={3}
          color="teal"
        >
          <Text>{seconds}</Text>
        </CircularProgress>
      </Flex>

      <FlatList
        data={auths}
        keyExtractor={(auth) => auth.label}
        renderItem={ListItem}
      />
      <Flex justifyContent="flex-end" alignItems="flex-end">
        <IconButton
          p={3}
          margin={10}
          borderRadius={60}
          variant="solid"
          icon={<AddIcon size={8} />}
          onPress={() => console.log('Pressed')}
        />
      </Flex>
    </View>
  );
};
