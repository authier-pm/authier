import {
  Avatar,
  Box,
  Button,
  FlatList,
  Flex,
  Icon as NativeIcon,
  IconButton,
  Modal,
  Text,
  Pressable,
} from 'native-base';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotifyContext } from '../NotifyProvider';

const Home = () => {
  const { notifies, setNotifies } = useContext(NotifyContext);
  const [isBio, setIsBio] = useState(false);
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const authenticate = (page: string) => {
    if (isBio) {
      ReactNativeBiometrics.simplePrompt({
        promptMessage: 'Confirm fingerprint',
      })
        .then(async (resultObject) => {
          const { success } = resultObject;
          if (success) {
            //call here api, maybe wait on success confirmation

            setNotifies(
              notifies.filter((el) => (el.pageName === page ? false : true))
            );
            await AsyncStorage.removeItem('notifies', (e) => {
              if (e) console.log(e);
            });
          } else {
            console.log('user cancelled biometric prompt');
          }
        })
        .catch(() => {
          console.log('biometrics failed');
        });
    }
  };

  const updateList = async () => {
    const jsonValue = await AsyncStorage.getItem('notifies', (e) => {
      if (e) console.log('error in async storage', e);
    });

    if (jsonValue) {
      let data = JSON.parse(jsonValue as string);
      setNotifies([data.data]);
    } else {
      setNotifies([]);
    }

    setRefreshing(false);
  };

  useEffect(() => {
    async function getBio() {
      const { biometryType } = await ReactNativeBiometrics.isSensorAvailable();

      if (biometryType === ReactNativeBiometrics.Biometrics) {
        setIsBio(true);
      }
    }

    getBio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    updateList();
  };

  //@ts-expect-error
  const ListItem = ({ item }) => {
    console.log('item', item);
    return (
      <Pressable
        key={item.pageName}
        backgroundColor="#ffffff"
        p={7}
        flexDirection="row"
        borderBottomWidth={0.5}
        borderBottomRadius={25}
        borderBottomColor="#a7a7a7"
        onPress={() => authenticate(item.pageName)}
      >
        <Flex>
          <Avatar
            size="lg"
            source={{
              uri: 'https://via.placeholder.com/150',
            }}
            mr={10}
          >
            NB
          </Avatar>
        </Flex>
        <Flex flexDirection="column">
          <Text fontSize={20}>{item.pageName}</Text>
          <Flex flexDirection="row" alignItems="center">
            <Icon name="desktop" color="gray" />
            <Text ml={1}>{item.device}</Text>
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            <Icon name="locate" color="gray" />
            <Text ml={1}>{item.location}</Text>
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            <Icon name="time" color="gray" />
            <Text ml={1}>{item.time}</Text>
          </Flex>
        </Flex>
        <Modal isOpen={open} onClose={() => setOpen(false)} mt={12}>
          <Modal.Content maxWidth={130} maxHeight={112}>
            <Modal.CloseButton />
            <Modal.Body>
              <Button.Group
                variant="ghost"
                display="flex"
                flexDirection="column"
              >
                <Button>Edit</Button>
                <Button>Delete</Button>
              </Button.Group>
            </Modal.Body>
          </Modal.Content>
        </Modal>
      </Pressable>
    );
  };

  return (
    <Box safeArea flex={1}>
      <Text>notification here</Text>

      <FlatList
        data={notifies}
        keyExtractor={(noti) => {
          return noti.pageName;
        }}
        renderItem={ListItem}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </Box>
  );
};

export default Home;
