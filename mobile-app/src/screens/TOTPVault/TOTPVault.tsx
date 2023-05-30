import React, { useEffect, useState } from 'react'

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

import TOTPSecret from '../../components/TOTPSecret'
import { FlashList } from '@shopify/flash-list'
import { Trans } from '@lingui/macro'
import CircularProgress from 'react-native-circular-progress-indicator'
import { TOTPStackScreenProps } from '../../navigation/types'
import { useDeviceStateStore } from '@src/utils/deviceStateStore'
import { useDeviceStore } from '@src/utils/deviceStore'

const EmptyList = () => {
  return (
    <Box p={4}>
      <Text>
        <Trans>
          Start by adding a secret by logging onto any website or by adding a
          TOTP code
        </Trans>
      </Text>
    </Box>
  )
}

export const TOTPVault = ({
  navigation
}: TOTPStackScreenProps<'TOTPVault'>) => {
  const [refreshing, setRefreshing] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30)
  let deviceState = useDeviceStateStore((state) => state)
  let device = useDeviceStore((state) => state)
  const [filterBy, setFilterBy] = useState('')

  const timer = () => {
    const epoch = Math.round(new Date().getTime() / 1000.0)
    const countDown = 30 - (epoch % 30)
    setRemainingSeconds(countDown)
  }

  const toast = useToast()
  useEffect(() => {
    setInterval(timer, 1000)
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await deviceState.backendSync(toast)
    setRefreshing(false)
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
          titleColor={useColorModeValue('black', 'white')}
          activeStrokeColor={'#22AAA1'}
          activeStrokeWidth={9}
          inActiveStrokeWidth={7}
        />
      </Flex>

      <FlashList
        ListEmptyComponent={EmptyList}
        estimatedItemSize={90}
        data={device.TOTPSecrets().filter(({ totp }) => {
          return totp.label.includes(filterBy) || totp.url?.includes(filterBy)
        })}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <TOTPSecret item={item} />}
        onRefresh={() => onRefresh()}
        refreshing={refreshing}
      />

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
