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
  Switch,
  useInterval
} from '@chakra-ui/react'

import { AuthsList } from '../components/AuthsList'
import { authenticator } from 'otplib'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

export const Home: FunctionComponent = () => {
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())

  const { deviceState, TOTPSecrets } = useContext(DeviceStateContext)

  useInterval(() => {
    setRemainingSeconds(authenticator.timeRemaining())
  }, 1000)

  const [filterByTLD, setFilterByTLD] = useState(false)

  return (
    <>
      <Flex position="sticky" align="center" pl={4} pr={4} mt={3}>
        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Filter by TLD</FormLabel>
          <Switch
            mr="auto"
            checked={filterByTLD}
            onChange={(enabled) => {
              setFilterByTLD(enabled.target.checked)
            }}
          ></Switch>
        </FormControl>

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
