import {
  HStack,
  VStack,
  Icon as NativeIcon,
  IconButton,
  View,
  Text,
  Heading,
  Pressable,
  useToast,
  Box,
  Center
} from 'native-base'
import React, { useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import Clipboard from '@react-native-clipboard/clipboard'

import { generateOTP } from '../utils/otp'
import { SecretItemIcon } from './SecretItemIcon'
import { useNavigation } from '@react-navigation/native'
import { ITOTPSecret } from '../utils/Device'
import { TOTPStackScreenProps } from '../navigation/types'

export default function TOTPSecret({ item }: { item: ITOTPSecret }) {
  const [showWhole, setShowWhole] = useState<boolean>(false)
  const otp = generateOTP(item.totp)

  const toast = useToast()
  const id = 'copied-toast'
  const copyToClipboard = (str: string) => {
    Clipboard.setString(str)
  }
  const navigation =
    useNavigation<TOTPStackScreenProps<'TOTPVault'>['navigation']>()

  return (
    <Pressable
      onPress={() => {
        copyToClipboard(item.totp)
        if (!toast.isActive(id)) {
          toast.show({
            id,
            render: () => {
              return (
                <Box bg='emerald.500' px='2' py='1' rounded='md' mb={5}>
                  Copied!
                </Box>
              )
            }
          })
        }
      }}
    >
      {({ isPressed }) => {
        return (
          <View
            borderBottomWidth={0.5}
            borderBottomRadius={25}
            borderBottomColor='#a7a7a7'
            p={5}
            style={{
              transform: [
                {
                  scale: isPressed ? 0.96 : 1
                }
              ]
            }}
          >
            <HStack space={5}>
              <SecretItemIcon iconUrl={item.iconUrl} url={item.url as string} />

              <HStack flexGrow={1} justifyContent={'space-between'}>
                <VStack>
                  <Heading size='md'>{item.label}</Heading>

                  <Text
                    fontSize={30}
                    onPress={() => {
                      setShowWhole(!showWhole)
                    }}
                  >
                    {showWhole ? otp : otp.substring(0, 3) + '***'}
                  </Text>
                </VStack>
              </HStack>

              <Center>
                <IconButton
                  icon={
                    <NativeIcon
                      size={'lg'}
                      as={<Icon name='create-outline' />}
                    />
                  }
                  color='#949090'
                  size={'md'}
                  onPress={() => navigation.navigate('EditTOTP', { item })}
                />
              </Center>
            </HStack>
          </View>
        )
      }}
    </Pressable>
  )
}
