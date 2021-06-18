import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { browser } from 'webextension-polyfill-ts'

import {
  Box,
  ChakraProvider,
  CircularProgress,
  Flex,
  Grid,
  Heading,
  useInterval,
  Text
} from '@chakra-ui/react'

import { Trans } from '@lingui/macro'

import { AddAuthSecretButton } from '../../popup/AddAuthSecretButton'
import { AuthsList } from '../../popup/AuthsList'
import { authenticator } from 'otplib'

export const Home: FunctionComponent = () => {
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())

  useInterval(() => {
    setRemainingSeconds(authenticator.timeRemaining())
  }, 1000)

  return (
    <>
      <Flex position="sticky" align="center" p={4}>
        <CircularProgress
          min={1}
          max={30}
          value={30 - seconds}
          valueText={seconds.toString()}
          size="40px"
        />
        <AddAuthSecretButton />
        <Heading size="sm">
          <Trans>Logout</Trans>
        </Heading>
      </Flex>
      <Box height={200} width={300} p={5} mb={5}>
        <Grid gap={3} mb={5}>
          <AuthsList />
        </Grid>
      </Box>
    </>
  )
}
