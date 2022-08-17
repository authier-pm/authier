import React, { useContext, useEffect, useState } from 'react'

import { View, Text, AddIcon, Flex, useToast, Fab, Box } from 'native-base'

import { SearchBar } from '../../components/SearchBar'
import { DeviceContext } from '../../providers/DeviceProvider'
import LoginCredential from '../../components/LoginCredential'
import { FlashList } from '@shopify/flash-list'
import { Trans } from '@lingui/macro'
import { PasswordStackScreenProps } from '../../navigation/types'

export const PasswordVault = ({
  navigation
}: PasswordStackScreenProps<'PasswordsVault'>) => {
  const toast = useToast()
  let device = useContext(DeviceContext)
  const [refreshing, setRefreshing] = useState(false)
  const [filterBy, setFilterBy] = useState('')

  const hasNoSecrets = device.state?.secrets.length === 0

  const onRefresh = async () => {
    setRefreshing(true)
    let res
    try {
      res = await device.state?.backendSync()
    } catch (error) {
      console.log(error)
      setRefreshing(false)
    }

    setRefreshing(false)

    if (
      (res?.newAndUpdatedSecrets as number) > 0 ||
      (res?.removedSecrets as number) > 0
    ) {
      toast.show({
        title: 'Vault synced',
        description: `Sync successful, added/updated ${res?.newAndUpdatedSecrets}, removed ${res?.removedSecrets}`
      })
    }
  } //Maybe?

  useEffect(() => navigation.addListener('focus', () => onRefresh()), [])

  return (
    <View>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <SearchBar setFilterBy={setFilterBy} />
      </Flex>

      {hasNoSecrets ? ( // TODO login form illustration
        <Box p={4}>
          <Text>
            <Trans>
              Start by adding a secret by logging onto any website or by adding
              a TOTP code
            </Trans>
          </Text>
        </Box>
      ) : (
        //Virtualize??
        <FlashList
          estimatedItemSize={104}
          data={device.loginCredentials.filter(({ label, url }) => {
            return label.includes(filterBy) || url?.includes(filterBy)
          })}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <LoginCredential item={item} />}
          onRefresh={() => onRefresh()}
          refreshing={refreshing}
        />
      )}

      <Fab
        onPress={() => navigation.navigate('AddPassword')}
        m={2}
        borderRadius={60}
        variant="solid"
        renderInPortal={false}
        shadow={2}
        size="sm"
        icon={<AddIcon color="white" size={6} />}
      />
    </View>
  )
}
