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
  View,
  Pressable,
} from 'native-base';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthsContext } from '../Providers';

const Home = () => {
  const { auths, setAuths } = useContext(AuthsContext);
  const [isBio, setIsBio] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function getbio() {
      const { biometryType } = await ReactNativeBiometrics.isSensorAvailable();

      if (biometryType === ReactNativeBiometrics.Biometrics) {
        setIsBio(true);
      }
    }
    getbio();
  });

  const authenticate = (label) => {
    if (isBio) {
      ReactNativeBiometrics.simplePrompt({
        promptMessage: 'Confirm fingerprint',
      })
        .then((resultObject) => {
          const { success } = resultObject;
          if (success) {
            //call here api, maybe wait on success confirmation
            setAuths(auths.filter((el) => (el.label === label ? false : true)));
          } else {
            console.log('user cancelled biometric prompt');
          }
        })
        .catch(() => {
          console.log('biometrics failed');
        });
    }
  };

  const ListItem = ({ item }) => {
    return (
      <Pressable
        backgroundColor="#ffffff"
        p={7}
        flexDirection="row"
        borderBottomWidth={0.5}
        borderBottomRadius={25}
        borderBottomColor="#a7a7a7"
        onPress={() => authenticate(item.label)}
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
          <Text fontSize={20}>{item.label}</Text>
          <Flex flexDirection="row" alignItems="center">
            <Icon name="desktop" color="gray" />
            <Text ml={1}>Chrome on Macbook</Text>
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            <Icon name="locate" color="gray" />
            <Text ml={1}>Brno</Text>
          </Flex>
          <Flex flexDirection="row" alignItems="center">
            <Icon name="time" color="gray" />
            <Text ml={1}>15:45 AM</Text>
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
    <Box safeArea>
      <Text>notification here</Text>
      <Button
        onPress={() => {
          if (isBio) {
            ReactNativeBiometrics.simplePrompt({
              promptMessage: 'Confirm fingerprint',
            })
              .then((resultObject) => {
                const { success } = resultObject;
                if (success) {
                  console.log('successful biometrics provided');
                } else {
                  console.log('user cancelled biometric prompt');
                }
              })
              .catch(() => {
                console.log('biometrics failed');
              });
          }
        }}
      >
        Test
      </Button>
      <FlatList
        data={auths}
        keyExtractor={(auth) => auth.label}
        renderItem={ListItem}
      />
    </Box>
  );
};

export default Home;
