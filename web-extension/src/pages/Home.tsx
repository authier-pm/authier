import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'

// var str2ab = require('string-to-arraybuffer')
// var ab2str = require('arraybuffer-to-string')

import {
  Box,
  Button,
  CircularProgress,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Switch,
  useInterval
} from '@chakra-ui/react'

import { AuthsList } from '../components/AuthsList'
import { authenticator } from 'otplib'
import { useLocation } from 'wouter'
import { UserContext } from '@src/providers/UserProvider'

import { BackgroundContext } from '@src/providers/BackgroundProvider'

export const Home: FunctionComponent = () => {
  const [location, setLocation] = useLocation()
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())

  const { backgroundState } = useContext(BackgroundContext)

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

        {backgroundState && backgroundState.totpSecrets.length > 0 && (
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

// COMPLEX ENCRYPTING
// let password = 'bob'
// let email = 'bob@bob.com'
// let enc = new TextEncoder()

// console.log(email + password)
// let vaultKey = await VaultKey(
//   Buffer.from(new Int16Array()),
//   email + password
// )

// const rawVaultKey = await crypto.subtle.exportKey('raw', vaultKey)
// let vaultKeyString = ab2str(rawVaultKey, 'base64')

// let iv = window.crypto.getRandomValues(new Uint8Array(12))
// let e = await window.crypto.subtle.encrypt(
//   {
//     name: 'AES-GCM',
//     iv: iv
//   },
//   vaultKey,
//   Buffer.from('test')
// )

// const res = await window.crypto.subtle.decrypt(
//   {
//     name: 'AES-GCM',
//     iv: iv
//   },
//   vaultKey,
//   e
// )
// console.log(ab2str(res))
// let combined = vaultKeyString + password

// let keyMaterial = await window.crypto.subtle.importKey(
//   'raw',
//   Buffer.from(combined),
//   'PBKDF2',
//   false,
//   ['deriveBits', 'deriveKey']
// )

// let authKey = await AuthKey(
//   Buffer.from(new Int16Array()),
//   keyMaterial
// )

// let rawAuthKey = await crypto.subtle.exportKey('raw', authKey)
// let authKeyString = ab2str(rawAuthKey, 'base64')
// console.log(authKeyString)
