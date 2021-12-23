/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useState } from 'react'
import OTP from 'otp-client'
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
import { useEncryptedAuthsLazyQuery } from './Vault.codegen'
import { ITOTPSecret, UserContext } from '../providers/UserProvider'
import Clipboard from '@react-native-clipboard/clipboard'
import { generateOTP } from '../utils/otp'

const options = {
  algorithm: 'sha1',
  digits: 6
}

const OtpCode = ({
  item,
  setRemainingSeconds,
  setShowWhole,
  showWhole,
  setOpen,
  open
}) => {
  const otp = new OTP(item.secret, options)
  //finish clipboard
  const [copiedText, setCopiedText] = useState('')
  const code = generateOTP(item.secret)

  const copyToClipboard = () => {
    Clipboard.setString('hello world')
  }

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
            uri: item.icon
          }}
        >
          NB
        </Avatar>
      </Flex>
      <Flex flexDirection="column">
        <Text fontSize={20}>{item.label}</Text>
        <Text>{item.label}</Text>
        <Flex flexDirection="row" alignItems="center">
          <Text
            fontSize={35}
            onPress={() => {
              setShowWhole(!showWhole)
            }}
          >
            {showWhole ? code : code.substr(0, 3) + '***'}
          </Text>
          <NativeIcon
            color="red.500"
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
            <Button.Group variant="ghost" display="flex" flexDirection="column">
              <Button>Edit</Button>
              <Button>Delete</Button>
            </Button.Group>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </View>
  )
}

const LoginCredentials = ({ item, setOpen, open }) => {
  return (
    <View
      backgroundColor="#ffffff"
      flexDirection="row"
      p={6}
      borderBottomWidth={0.5}
      borderBottomRadius={25}
      borderBottomColor="#a7a7a7"
      justifyContent="space-between"
    >
      <Flex>
        <Avatar
          size="md"
          source={{
            uri: item.favIconUrl
          }}
        >
          NB
        </Avatar>
      </Flex>
      <Flex flexDirection="column">
        <Text fontSize={20}>{item.label}</Text>
        <Flex flexDirection={'row'}>
          <Text>{item.username}</Text>
          <NativeIcon color="red" size="sm" as={<Icon name="copy-outline" />} />
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
            <Button.Group variant="ghost" display="flex" flexDirection="column">
              <Button>Edit</Button>
              <Button>Delete</Button>
            </Button.Group>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </View>
  )
}

const dummy: ITOTPSecret[] = [
  {
    secret: 'JBSWY3DPEHPK3PXP',
    label: 'bitfinex',
    icon: 'https://chakra-ui.com/favicon.png',
    originalUrl: 'https://chakra-ui.com/favicon.png'
  }
]

export const Vault = () => {
  const [encryptedAuths, { data, loading }] = useEncryptedAuthsLazyQuery()
  const { totpSecrets, decryptAndSaveData } = useContext(UserContext)

  const [showWhole, setShowWhole] = useState(false)
  const [open, setOpen] = useState(false)
  const [seconds, setRemainingSeconds] = useState(0)

  // useEffect(() => {
  //   encryptedAuths()

  //   if (data) {
  //     decryptAndSaveData(data.me?.encryptedSecrets)
  //   }

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [loading, data])

  return (
    <View flex={1} safeArea backgroundColor="light.50">
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        mr={5}
        alignItems="center"
      >
        <SearchBar />
        <CircularProgress
          value={seconds}
          size={8}
          min={0}
          max={30}
          thickness={3}
          color="teal.500"
        >
          <Text>{seconds}</Text>
        </CircularProgress>
      </Flex>

      <FlatList
        data={dummy}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <OtpCode
            item={item}
            open={open}
            setOpen={setOpen}
            setShowWhole={setShowWhole}
            setRemainingSeconds={setRemainingSeconds}
            showWhole={showWhole}
          />
        )}
      />

      <Flex justifyContent="flex-end" alignItems="flex-end">
        <IconButton
          p={3}
          margin={10}
          borderRadius={60}
          variant="solid"
          icon={<AddIcon color="light.50" size={8} />}
          onPress={() => console.log('Pressed')}
        />
      </Flex>
    </View>
  )
}
