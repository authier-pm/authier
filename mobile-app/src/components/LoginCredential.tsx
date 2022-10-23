import {
  HStack,
  VStack,
  IconButton,
  Text,
  View,
  Icon as NativeIcon,
  Pressable,
  useToast,
  Box,
  Center,
  Heading
} from 'native-base'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import Clipboard from '@react-native-clipboard/clipboard'
import { SecretItemIcon } from './SecretItemIcon'
import { useNavigation } from '@react-navigation/native'
import { ILoginSecret } from '../utils/Device'
import { PasswordStackScreenProps } from '../navigation/types'

const LoginCredential = ({ loginSecret }: { loginSecret: ILoginSecret }) => {
  const { loginCredentials } = loginSecret
  const navigation =
    useNavigation<PasswordStackScreenProps<'PasswordsVault'>['navigation']>()
  const toast = useToast()
  const id = 'copied-toast'
  const copyToClipboard = (str: string) => {
    Clipboard.setString(str)
  }

  const makeShorter = (str: string) => {
    if (str.length > 20) {
      return str.substring(0, 20) + '...'
    }
    return str
  }

  return (
    <Pressable
      onPress={() => {
        copyToClipboard(loginCredentials.password)
        if (!toast.isActive(id)) {
          toast.show({
            id,
            render: () => {
              return (
                <Box bg="emerald.500" px="2" py="1" rounded="md" mb={5}>
                  Copied!
                </Box>
              )
            },
            duration: 1000
          })
        }
      }}
    >
      {({ isPressed }) => {
        return (
          <View
            borderBottomWidth={0.5}
            borderBottomRadius={25}
            borderBottomColor="#a7a7a7"
            p="5"
            style={{
              transform: [
                {
                  scale: isPressed ? 0.96 : 1
                }
              ]
            }}
          >
            <HStack space={5}>
              <SecretItemIcon
                iconUrl={loginCredentials.iconUrl}
                url={loginCredentials.url!!}
              />

              <HStack flexGrow={1} justifyContent={'space-between'}>
                <VStack>
                  <Heading numberOfLines={1} size="md">
                    {makeShorter(loginCredentials.label)}
                  </Heading>

                  <Text fontSize="lg" numberOfLines={1} ellipsizeMode={'tail'}>
                    {makeShorter(
                      loginCredentials.username.replace(
                        /http:\/\/|https:\/\//,
                        ''
                      )
                    )}
                  </Text>
                </VStack>
              </HStack>

              <Center>
                <IconButton
                  icon={
                    <NativeIcon
                      size={'lg'}
                      as={<Icon name="create-outline" />}
                    />
                  }
                  color="#949090"
                  size={'md'}
                  onPress={() => {
                    navigation.navigate('EditPassword', { loginSecret })
                  }}
                />
              </Center>
            </HStack>
          </View>
        )
      }}
    </Pressable>
  )
}

export default LoginCredential
