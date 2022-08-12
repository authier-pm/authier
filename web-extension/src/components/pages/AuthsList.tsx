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
  useColorModeValue
} from '@chakra-ui/react'
import { authenticator } from 'otplib'

import { CopyIcon, NotAllowedIcon } from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import browser from 'webextension-polyfill'

import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'

import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import debug from 'debug'
import { SecretItemIcon } from '../SecretItemIcon'
import { extractHostname } from '@src/util/extractHostname'
import { useAddOtpEventMutation } from './AuthList.codegen'

const log = debug('au:AuthsList')

const OtpCode = ({ totpData }: { totpData: ITOTPSecret }) => {
  const [addOTPEvent, { data, error }] = useAddOtpEventMutation() //ignore results??
  const otpCode = authenticator.generate(totpData.totp)
  const [showWhole, setShowWhole] = useState(false)
  const { onCopy } = useClipboard(otpCode)

  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])

  return (
    <Box
      p="3"
      rounded="md"
      bg={useColorModeValue('gray.100', 'gray.700')}
      minW="300px"
    >
      <Stat maxW="100%">
        <Flex justify="space-between" align="center" w="100%">
          <Flex flexDirection="column">
            <SecretItemIcon {...totpData}></SecretItemIcon>
          </Flex>
          <Box ml={4} mr="auto">
            <StatLabel>{totpData.label}</StatLabel>

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
                        secretId: totpData.id
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
                <Tooltip label={t`Click to show the whole`}>
                  {otpCode.substr(0, 3) + '***'}
                </Tooltip>
              )}
            </StatNumber>
          </Box>
          <Tooltip label={t`Copy TOTP`}>
            <Button
              size="md"
              ml={2}
              variant="solid"
              colorScheme={'cyan'}
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
    </Box>
  )
}

const LoginCredentialsListItem = ({
  loginSecret
}: {
  loginSecret: ILoginSecret
}) => {
  const { onCopy } = useClipboard(loginSecret.loginCredentials.password)

  return (
    <Box boxShadow="xl" m={2}>
      <Flex
        key={loginSecret.url}
        p="3"
        rounded="md"
        bg={useColorModeValue('gray.100', 'gray.700')}
      >
        <Stat maxW="100%">
          <Flex justify="space-between" align="center" w="100%">
            <Flex flexDirection="column">
              <SecretItemIcon {...loginSecret} />
            </Flex>
            <Box ml={2} mr="auto" maxW="200px">
              <Heading
                size="sm"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {loginSecret.label}
              </Heading>
              <Text fontSize="sm" whiteSpace="nowrap">
                {loginSecret.loginCredentials.username.replace(
                  /http:\/\/|https:\/\//,
                  ''
                )}
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
export const AuthsList = ({ filterByTLD }: { filterByTLD: boolean }) => {
  const { deviceState, TOTPSecrets, loginCredentials, currentURL } =
    useContext(DeviceStateContext)

  if (!deviceState) {
    return null
  }

  const TOTPForCurrentDomain = TOTPSecrets.filter(({ url }) => {
    if (!currentURL || !url) {
      return true
    }
    return extractHostname(url) === extractHostname(currentURL)
  })
  const loginCredentialForCurrentDomain = loginCredentials.filter(({ url }) => {
    if (!currentURL || !url) {
      return true
    }

    return extractHostname(url) === extractHostname(currentURL)
  })

  const hasNoSecrets = deviceState.secrets.length === 0

  const getRecentlyUsed = (secrets: (ILoginSecret | ITOTPSecret)[]) => {
    return secrets
      .sort((a, b) =>
        (a.lastUsedAt ?? a.createdAt) >= (b.lastUsedAt ?? b.createdAt) ? 1 : -1
      )
      .slice(0, 20) // we get items
  }

  return (
    <>
      <Flex flexDirection="column">
        {hasNoSecrets === false &&
          filterByTLD &&
          TOTPForCurrentDomain.length === 0 &&
          loginCredentialForCurrentDomain.length === 0 && (
            <>
              <Text>
                <NotAllowedIcon></NotAllowedIcon>
                There are no stored secrets for current domain.
              </Text>
            </>
          )}

        {filterByTLD ? (
          <>
            {TOTPForCurrentDomain.map((auth, i) => {
              return (
                <OtpCode totpData={auth as ITOTPSecret} key={auth.label + i} />
              )
            })}
            {loginCredentialForCurrentDomain.map((credentials, i) => {
              return (
                <LoginCredentialsListItem
                  loginSecret={credentials as ILoginSecret}
                  key={credentials.label + i}
                />
              )
            })}
          </>
        ) : (
          [
            getRecentlyUsed(TOTPSecrets).map((auth, i) => {
              return (
                <OtpCode totpData={auth as ITOTPSecret} key={auth.label + i} />
              )
            }),
            getRecentlyUsed(loginCredentials).map((psw, i) => {
              console.log(psw.url)
              return (
                <LoginCredentialsListItem
                  loginSecret={psw as ILoginSecret}
                  key={psw.label + i}
                />
              )
            })
          ]
        )}
        {hasNoSecrets && (
          // TODO login form illustration
          <Text>
            Start by adding a secret by logging onto any website or by adding a
            TOTP code
          </Text>
        )}
      </Flex>
    </>
  )
}
