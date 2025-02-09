import React, { useContext, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useClipboard,
  Text,
  Heading,
  useColorModeValue,
  Center
} from '@chakra-ui/react'
import { authenticator } from 'otplib'

import { CopyIcon, NotAllowedIcon } from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import browser from 'webextension-polyfill'

import { ILoginSecret, ISecret, ITOTPSecret } from '@src/util/useDeviceState'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import debug from 'debug'
import { SecretItemIcon } from '../SecretItemIcon'

import { useAddOtpEventMutation } from './AuthList.codegen'
import { getDomainNameAndTldFromUrl } from '@shared/urlUtils'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { PopupActionsEnum } from './PopupActionsEnum'
import { SquareMousePointer } from './SquareMousePointerIcon'

const log = debug('au:AuthsList')

const OtpCode = ({ totpSecret }: { totpSecret: ITOTPSecret }) => {
  const [addOTPEvent, { data, error }] = useAddOtpEventMutation() //ignore results??

  // const otpCode = '1111'
  const otpCode = authenticator.generate(totpSecret.totp.secret)
  const [showWhole, setShowWhole] = useState(false)
  const { onCopy } = useClipboard(otpCode)

  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])

  return (
    <Box
      p="3"
      m={1}
      rounded="md"
      bg={useColorModeValue('gray.100', 'gray.700')}
      minW="300px"
    >
      <Stat maxW="100%">
        <Flex justify="space-between" align="center" w="100%">
          <Flex flexDirection="column">
            <SecretItemIcon {...totpSecret.totp}></SecretItemIcon>
          </Flex>
          <Box ml={4} mr="auto">
            <StatLabel>{totpSecret.totp.label}</StatLabel>

            <StatNumber
              onClick={async () => {
                setShowWhole(!showWhole)
                if (!showWhole) {
                  // CHECK
                  const tabs = await browser.tabs.query({ active: true })

                  const url = tabs[0].url as string

                  await addOTPEvent({
                    variables: {
                      event: {
                        kind: 'show OTP',
                        url: url,
                        secretId: totpSecret.id
                      }
                    }
                  })
                  log(data, error)
                }
              }}
            >
              {showWhole ? (
                otpCode
              ) : (
                <Tooltip label={t`Click to show & copy`}>
                  <div
                    onClick={() => {
                      onCopy()
                    }}
                  >
                    {otpCode.substr(0, 3) + '***'}
                    <CopyIcon></CopyIcon>
                  </div>
                </Tooltip>
              )}
            </StatNumber>
          </Box>
          <Tooltip label={t`Fill TOTP into input on screen by point&click`}>
            <Button
              size="md"
              ml={2}
              variant="solid"
              colorScheme={'cyan'}
              onClick={() => {
                // TODO log usage of this token to backend
                browser.runtime.sendMessage({
                  kind: PopupActionsEnum.TOTP_FILL_ON_CLICK,
                  event: {
                    otpCode,
                    secretId: totpSecret.id
                  }
                })
              }}
            >
              <SquareMousePointer></SquareMousePointer>
            </Button>
          </Tooltip>
        </Flex>
      </Stat>
    </Box>
  )
}

const LoginCredentialsListItem = ({
  loginSecret
}: {
  loginSecret: ILoginSecret
}) => {
  const { loginCredentials } = loginSecret
  const { onCopy } = useClipboard(loginCredentials.password)

  return (
    <Box boxShadow="xl" m={1}>
      <Flex
        key={loginCredentials.url}
        p="3"
        rounded="md"
        bg={useColorModeValue('gray.100', 'gray.700')}
      >
        <Stat maxW="100%">
          <Flex justify="space-between" align="center" w="100%">
            <Flex flexDirection="column">
              <SecretItemIcon {...loginCredentials} />
            </Flex>
            <Box ml={2} mr="auto" maxW="200px">
              <Heading
                size="sm"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {loginCredentials.label}
              </Heading>
              <Text fontSize="sm" whiteSpace="nowrap">
                {loginCredentials.username.replace(/http:\/\/|https:\/\//, '')}
              </Text>
            </Box>

            <Tooltip label={t`Copy password`}>
              <Button
                size="md"
                ml="auto"
                boxShadow="md"
                variant="solid"
                color={'green.700'}
                bgColor={'green.200'}
                onClick={() => {
                  onCopy()
                  // TODO log usage of this token to backend
                }}
              >
                <CopyIcon></CopyIcon>
              </Button>
            </Tooltip>
          </Flex>
        </Stat>
      </Flex>
    </Box>
  )
}
export const AuthsList = ({
  filterByTLD,
  search
}: {
  filterByTLD: boolean
  search: string
}) => {
  console.log('search:', search)
  const {
    deviceState,
    TOTPSecrets,
    loginCredentials,
    currentURL,
    searchSecrets
  } = useContext(DeviceStateContext)

  if (!deviceState) {
    return null
  }
  const TOTPForCurrentDomain = TOTPSecrets.filter(({ totp }) => {
    if (!currentURL || !totp.url) {
      return true
    }
    return (
      getDomainNameAndTldFromUrl(totp.url) ===
      getDomainNameAndTldFromUrl(currentURL)
    )
  })
  const loginCredentialForCurrentDomain = loginCredentials.filter(
    ({ loginCredentials }) => {
      if (!loginCredentials.url) {
        return false // for example TOTP secrets do not have any URL after import from authy
      }
      if (!currentURL) {
        return true
      }

      return (
        getDomainNameAndTldFromUrl(loginCredentials.url) ===
        getDomainNameAndTldFromUrl(currentURL)
      )
    }
  )
  const hasNoSecrets = deviceState.secrets.length === 0

  const getRecentlyUsed = <T extends ISecret>(secrets: T[]) => {
    return secrets
      .sort((a, b) =>
        (a.lastUsedAt ?? a.createdAt) >= (b.lastUsedAt ?? b.createdAt) ? 1 : -1
      )
      .slice(0, 20) // we get items
  }

  const totps = searchSecrets(search, [
    EncryptedSecretType.TOTP
  ]) as ITOTPSecret[]
  const creds = searchSecrets(search, [
    EncryptedSecretType.LOGIN_CREDENTIALS
  ]) as ILoginSecret[]
  return (
    <>
      <Flex flexDirection="column">
        {hasNoSecrets === false &&
          filterByTLD &&
          TOTPForCurrentDomain.length === 0 &&
          loginCredentialForCurrentDomain.length === 0 && (
            <Center h="50vh">
              <Text>
                <NotAllowedIcon></NotAllowedIcon>
                There are no stored secrets for current domain.
              </Text>
            </Center>
          )}

        {filterByTLD ? (
          <>
            {TOTPForCurrentDomain.map((auth, i) => {
              return (
                <OtpCode
                  totpSecret={auth as ITOTPSecret}
                  key={auth.totp.label + i}
                />
              )
            })}
            {loginCredentialForCurrentDomain.map((credentials, i) => {
              return (
                <LoginCredentialsListItem
                  loginSecret={credentials as ILoginSecret}
                  key={credentials.loginCredentials.label + i}
                />
              )
            })}
          </>
        ) : (
          [
            totps.slice(0, 20).map((auth, i) => {
              return (
                <OtpCode
                  totpSecret={auth as ITOTPSecret}
                  key={auth.totp.label + i}
                />
              )
            }),
            creds.slice(0, 20).map((psw, i) => {
              // console.log(psw.loginCredentials.url)
              return (
                <LoginCredentialsListItem
                  loginSecret={psw as ILoginSecret}
                  key={psw.loginCredentials.label + i}
                />
              )
            })
          ]
        )}
        {hasNoSecrets && (
          // TODO login form illustration
          <Text>Start by adding a login secret or TOTP code</Text>
        )}
      </Flex>
    </>
  )
}
