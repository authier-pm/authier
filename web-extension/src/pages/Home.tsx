import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'

import { browser } from 'webextension-polyfill-ts'
// var str2ab = require('string-to-arraybuffer')
// var ab2str = require('arraybuffer-to-string')

import {
  Box,
  Button,
  CircularProgress,
  Flex,
  Grid,
  Heading,
  useInterval
} from '@chakra-ui/react'

import { Trans } from '@lingui/macro'

import { AddAuthSecretButton } from '../components/AddAuthSecretButton'
import { AuthsList } from '../components/AuthsList'
import { authenticator } from 'otplib'
import { useLocation } from 'wouter'
import { removeToken } from '@src/util/accessToken'
import { UserContext } from '@src/providers/UserProvider'

export const Home: FunctionComponent = () => {
  const [location, setLocation] = useLocation()
  const [seconds, setRemainingSeconds] = useState(authenticator.timeRemaining())
  const { setPassword, isApiLoggedIn } = useContext(UserContext)

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
          <Button
            colorScheme={'teal'}
            onClick={async () => {
              // setIsAuth(false)
              await browser.storage.local.clear()
              removeToken()
              await chrome.runtime.sendMessage({
                clear: true
              })
            }}
          >
            Logout
          </Button>
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
