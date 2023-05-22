import React, { useContext, useState } from 'react'

import { View, Text, AddIcon, Flex, useToast, Fab, Box } from 'native-base'

import { SearchBar } from '@components/SearchBar'
import { DeviceContext } from '@providers/DeviceProvider'
import LoginCredential from '@components/LoginCredential'
import { FlashList } from '@shopify/flash-list'
import { Trans } from '@lingui/macro'
import { PasswordStackScreenProps } from '@navigation/types'

const EmptyList = () => {
  return (
    <Box p={4}>
      <Text>
        <Trans>Start by adding a login secret or a TOTP code</Trans>
      </Text>
    </Box>
  )
}

export const PasswordVault = ({
  navigation
}: PasswordStackScreenProps<'PasswordsVault'>) => {
  const toast = useToast()
  let device = useContext(DeviceContext)
  const [refreshing, setRefreshing] = useState(false)
  const [filterBy, setFilterBy] = useState('')

  const onRefresh = async () => {
    setRefreshing(true)

    try {
      await device.state?.backendSync(toast)
    } catch (error) {
      console.log(error)
    } finally {
      setRefreshing(false)
    }

    setRefreshing(false)
  }

  return (
    <View>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <SearchBar setFilterBy={setFilterBy} />
      </Flex>

      <FlashList
        ListEmptyComponent={EmptyList}
        //FIX: Dont like empty space on fast scroll
        estimatedItemSize={90}
        data={device.loginCredentials.filter(
          ({ loginCredentials: { url, label } }) => {
            return label.includes(filterBy) || url?.includes(filterBy)
          }
        )}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <LoginCredential loginSecret={item} />}
        onRefresh={() => onRefresh()}
        refreshing={refreshing}
      />
      <Fab
        onPress={() => navigation.navigate('AddPassword')}
        m={2}
        borderRadius={60}
        renderInPortal={false}
        shadow={2}
        size="sm"
        icon={<AddIcon color="white" size={6} />}
      />
    </View>
  )
}
