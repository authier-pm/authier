import React, { FunctionComponent, useContext, useState } from 'react'

// var str2ab = require('string-to-arraybuffer')
// var ab2str = require('arraybuffer-to-string')

import {
  Box,
  CircularProgress,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  Stack,
  Switch,
  useInterval
} from '@chakra-ui/react'

import { AuthsList } from '../components/AuthsList'
import { authenticator } from 'otplib'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { AddIcon } from '@chakra-ui/icons'

export const Home: FunctionComponent = () => {
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())

  const { deviceState, TOTPSecrets, currentURL } =
    useContext(DeviceStateContext)

  useInterval(() => {
    setRemainingSeconds(authenticator.timeRemaining())
  }, 1000)

  const [filterByTLDManual, setFilterByTLD] = useState<null | boolean>(null) // when in vault or browser config, show all: ;

  const filterByTLD =
    filterByTLDManual === null
      ? currentURL.startsWith('http')
      : filterByTLDManual
  return (
    <>
      <Flex position="sticky" align="center" pl={4} pr={4} mt={3}>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Filter by TLD</FormLabel>
          <Switch
            mr="auto"
            isChecked={filterByTLD}
            // checked={filterByTLD}
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
      <Box height={200} width={330} p={5} mb={5}>
        <Grid gap={3} mb={5}>
          <AuthsList filterByTLD={filterByTLD} />
        </Grid>
      </Box>
    </>
  )
}
