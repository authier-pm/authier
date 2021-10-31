import React, { useContext, useState } from 'react'
import OTP from 'otp-client'
import { AuthsContext } from '../Providers'
import {
  Modal,
  FlatList,
  Icon as NativeIcon,
  IconButton,
  View,
  Text,
  AddIcon,
  Avatar,
  Flex,
  CircularProgress,
  Button
} from 'native-base'
import Icon from 'react-native-vector-icons/Ionicons'
import { SearchBar } from '../components/SearchBar'
import { generateOTP } from '../utils/otp'

const options = {
  algorithm: 'sha1',
  digits: 6
}

export const Vault = () => {
  const { auths } = useContext(AuthsContext)
  const [showWhole, setShowWhole] = useState(false)
  const [open, setOpen] = useState(false)
  const [seconds, setRemainingSeconds] = useState(0)

  const ListItem = ({ item }) => {
    const otp = new OTP(item.secret, options)
    const code = generateOTP(item.secret)
    console.log('~ code2', code)
    setInterval(() => {
      setRemainingSeconds(otp.getTimeUntilNextTick())
    }, 1000)

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
              uri: 'https://via.placeholder.com/150'
            }}
          >
            NB
          </Avatar>
        </Flex>
        <Flex flexDirection="column">
          <Text fontSize={20}>{item.label}</Text>
          <Text>nick name</Text>
          <Flex flexDirection="row" alignItems="center">
            <Text
              fontSize={35}
              onPress={() => {
                setShowWhole(true)
              }}
            >
              {showWhole ? otp.getToken() : otp.getToken().substr(0, 3) + '***'}
            </Text>
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
          onPress={() => setOpen(true)}
        />
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
      </View>
    )
  }

  return (
    <View flex={1} safeArea backgroundColor="white">
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        mr={5}
        alignItems="center"
      >
        <SearchBar />
        {/* <CircularProgress
          value={seconds}
          size={8}
          min={0}
          max={30}
          thickness={3}
          color="teal"
        >
          <Text>{seconds}</Text>
        </CircularProgress> */}
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
          icon={<AddIcon color="white" size={8} />}
          onPress={() => console.log('Pressed')}
        />
      </Flex>
    </View>
  )
}
