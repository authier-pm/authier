import React, { FunctionComponent, useContext, useState } from 'react'

import {
  Box,
  CircularProgress,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  Switch,
  useInterval
} from '@chakra-ui/react'
import browser from 'webextension-polyfill'
import { authenticator } from 'otplib'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AddIcon } from '@chakra-ui/icons'
import { AuthsList } from '@src/components/pages/AuthsList'
import { openVaultTab } from '@src/AuthLinkPage'

export const Home: FunctionComponent = () => {
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())

  const { deviceState, TOTPSecrets, currentURL } =
    useContext(DeviceStateContext)

  useInterval(() => {
    setRemainingSeconds(authenticator.timeRemaining())
  }, 1000)

  const [filterByTLDManual, setFilterByTLD] = useState<null | boolean>(null) // when in vault or browser config, show all: ;

  const filterByTLD = !currentURL
    ? true
    : filterByTLDManual === null
    ? currentURL.startsWith('http')
    : filterByTLDManual
  return (
    <>
      <Flex position="sticky" align="center" pl={4} pr={4} mt={'56px'}>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Filter by TLD</FormLabel>
          <Switch
            mr="auto"
            isChecked={filterByTLD}
            onChange={(enabled) => {
              setFilterByTLD(enabled.target.checked)
            }}
          ></Switch>
        </FormControl>

        <IconButton
          mr={15}
          colorScheme="blue"
          aria-label="Add item"
          icon={<AddIcon />}
          rounded={'full'}
          onClick={async () => {
            openVaultTab('/addItem?url=' + currentURL)
          }}
        />

        {deviceState && TOTPSecrets.length > 0 && (
          <CircularProgress
            min={1}
            ml="auto"
            max={30}
            value={30 - seconds}
            valueText={seconds.toString()}
            size="40px"
          />
        )}
      </Flex>
      <Box height={300} width={350} pr={5} pl={5} mb={2}>
        <Grid gap={3} mb={5}>
          <AuthsList filterByTLD={filterByTLD} />
        </Grid>
      </Box>
    </>
  )
}
