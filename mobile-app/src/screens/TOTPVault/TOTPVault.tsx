import React, { useContext, useEffect, useState } from 'react'

import {
  View,
  Text,
  AddIcon,
  Flex,
  useToast,
  Fab,
  Box,
  useColorModeValue
} from 'native-base'

import { SearchBar } from '../../components/SearchBar'
import { DeviceContext } from '../../providers/DeviceProvider'
import TOTPSecret from '../../components/TOTPSecret'
import { FlashList } from '@shopify/flash-list'
import { Trans } from '@lingui/macro'
import CircularProgress from 'react-native-circular-progress-indicator'
import { TOTPStackScreenProps } from '../../navigation/types'

export const TOTPVault = ({
  navigation
}: TOTPStackScreenProps<'TOTPVault'>) => {
  const [refreshing, setRefreshing] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30)
  let device = useContext(DeviceContext)
  const [filterBy, setFilterBy] = useState('')

  const timer = () => {
    var epoch = Math.round(new Date().getTime() / 1000.0)
    var countDown = 30 - (epoch % 30)
    setRemainingSeconds(countDown)
  }

  const toast = useToast()
  useEffect(() => {
    setInterval(timer, 1000)
  }, [])
  const hasNoSecrets = device.state?.secrets.length === 0

  const onRefresh = async () => {
    setRefreshing(true)
    const res = await device.state?.backendSync()
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
  }

  return (
    <View>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        mr={8}
        alignItems="center"
      >
        <SearchBar setFilterBy={setFilterBy} />
        <CircularProgress
          value={remainingSeconds}
          radius={22}
          maxValue={30}
          textColor={useColorModeValue('black', 'white')}
          activeStrokeColor={'#22AAA1'}
          activeStrokeWidth={9}
          inActiveStrokeWidth={7}
        />
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
        <FlashList
          estimatedItemSize={104}
          data={device.TOTPSecrets.filter(({ label, url }) => {
            return label.includes(filterBy) || url?.includes(filterBy)
          })}
          keyExtractor={(i) => i.id}
          //@ts-expect-error TODO @capaj
          renderItem={({ item }) => <TOTPSecret item={item} />}
          onRefresh={() => onRefresh()}
          refreshing={refreshing}
        />
      )}

      <Fab
        onPress={() => navigation.navigate('AddTOTP')}
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
