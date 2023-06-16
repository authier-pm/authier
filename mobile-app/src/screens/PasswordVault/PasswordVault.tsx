import React, { useState } from 'react'

import {
  View,
  Text,
  AddIcon,
  useToast,
  IconButton,
  HStack,
  Image,
  Center
} from 'native-base'

import { SearchBar } from '@components/SearchBar'
import LoginCredential from '@components/LoginCredential'
import { FlashList } from '@shopify/flash-list'
import { Trans } from '@lingui/macro'
import { PasswordStackScreenProps } from '@navigation/types'
import { useDeviceStore } from '@src/utils/deviceStore'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'

export const EmptyList = (text: string) => {
  return (
    <Center p={4}>
      <Text>
        <Trans>{text}</Trans>
      </Text>
      <Image
        boxSize="md"
        source={require('../../../assets/empty.png')}
        alt="Empty list"
      />
    </Center>
  )
}

export const PasswordVault = ({
  navigation
}: PasswordStackScreenProps<'PasswordsVault'>) => {
  const toast = useToast()
  let device = useDeviceStore((state) => state)
  let deviceState = useDeviceStateStore((state) => state)
  const [refreshing, setRefreshing] = useState(false)
  const [filterBy, setFilterBy] = useState('')

  const onRefresh = async () => {
    setRefreshing(true)

    try {
      await deviceState.backendSync(toast)
    } catch (error) {
      console.log(error)
    } finally {
      setRefreshing(false)
    }
    setRefreshing(false)
  }

  return (
    <View>
      <HStack flexDirection="row" alignItems="center" space={4} m={4}>
        <SearchBar setFilterBy={setFilterBy} />
        <IconButton
          colorScheme="primary"
          rounded="lg"
          variant="solid"
          icon={<AddIcon color="white" size={6} />}
          onPress={() => navigation.navigate('AddPassword')}
        />
      </HStack>

      <FlashList
        ListEmptyComponent={EmptyList('Start by adding a login secret')}
        //FIX: Dont like empty space on fast scroll
        estimatedItemSize={90}
        data={device
          .loginCredentials()
          .filter(({ loginCredentials: { url, label } }) => {
            return label.includes(filterBy) || url?.includes(filterBy)
          })}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <LoginCredential loginSecret={item} />}
        onRefresh={() => onRefresh()}
        refreshing={refreshing}
      />
    </View>
  )
}
