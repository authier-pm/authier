import React, {
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState
} from 'react'
import Chakra, {
  Avatar,
  Box,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useClipboard,
  Text,
  Heading,
  IconButton,
  Divider,
  Switch
} from '@chakra-ui/react'
import { authenticator } from 'otplib'

import {
  CopyIcon,
  DeleteIcon,
  EditIcon,
  NotAllowedIcon
} from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import browser from 'webextension-polyfill'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import { extractHostname } from '../util/extractHostname'
import { useAddOtpEventMutation } from './AuthList.codegen'
import { getUserFromToken } from '@src/util/accessTokenExtension'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { UIOptions } from './setting-screens/SettingsForm'
import RemoveAlertDialog from './RemoveAlertDialog'

import { UserContext } from '@src/providers/UserProvider'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import debug from 'debug'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
const log = debug('au:AuthsList')

const OtpCode = ({ totpData }: { totpData: ITOTPSecret }) => {
  console.log('~ totpData', totpData)
  const [addOTPEvent, { data, loading, error }] = useAddOtpEventMutation() //ignore results??
  const otpCode = authenticator.generate(totpData.totp)
  const [showWhole, setShowWhole] = useState(false)
  const { onCopy } = useClipboard(otpCode)
  const [isOpen, setIsOpen] = useState(false)
  const cancelRef = useRef()
  const { userId } = useContext(UserContext)
  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])

  return (
    <Box boxShadow="2xl" p="4" rounded="md" bg="white">
      <Stat>
        <Flex justify="flex-start" align="center">
          <Flex flexDirection="column">
            <IconButton
              colorScheme="teal"
              aria-label="Edit secret"
              icon={<EditIcon />}
              size="sm"
              variant="link"
              position="absolute"
              zIndex="overlay"
              top={-1}
              left={-15}
              onClick={() => setIsOpen(true)}
            />

            <Avatar src={totpData.iconUrl as string} size="sm"></Avatar>
          </Flex>
          <Box ml={4} mr="auto">
            <StatLabel>{totpData.label}</StatLabel>

            <StatNumber
              onClick={async () => {
                setShowWhole(!showWhole)
                if (!showWhole) {
                  // CHECK
                  let tabs = await browser.tabs.query({ active: true })

                  let url = tabs[0].url as string

                  await addOTPEvent({
                    variables: {
                      kind: 'show OTP',
                      url: url
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
              variant="outline"
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
  const [isOpen, setIsOpen] = useState(false)
  const cancelRef = useRef()

  const { onCopy } = useClipboard(loginSecret.loginCredentials.password)

  return (
    <Flex key={loginSecret.url} p="3" rounded="md" bg="white" minW="300px">
      <Stat maxW="100%">
        <Flex justify="space-between" align="center" w="100%">
          <Flex flexDirection="column">
            <Avatar src={loginSecret.iconUrl as string} size="xs"></Avatar>
          </Flex>
          <Box ml={2} mr="auto" maxW="200px">
            <Heading size="sm">{loginSecret.label}</Heading>
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
              variant="outline"
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
  )
}
export const AuthsList = ({ filterByTLD }: { filterByTLD: boolean }) => {
  const { deviceState, TOTPSecrets, LoginCredentials } =
    useContext(DeviceStateContext)

  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)
  // const [showForCurrentUrlDomain, setShowForCurrentUrlDomain] = useState(true)
  const [_, forceUpdate] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    getCurrentTab().then((tab) => {
      log('~ tab?.url', tab?.url)

      setCurrentTabUrl(tab?.url ?? null)
    })
  }, [])

  if (!deviceState) {
    return null
  }

  const TOTPForCurrentDomain = TOTPSecrets.filter(({ url }) => {
    if (!currentTabUrl || !url) {
      return true
    }
    return extractHostname(url) === extractHostname(currentTabUrl)
  })
  const loginCredentialForCurrentDomain = LoginCredentials.filter(({ url }) => {
    if (!currentTabUrl || !url) {
      return true
    }
    return extractHostname(url) === extractHostname(currentTabUrl)
  })

  const hasNoSecrets = deviceState.secrets.length === 0
  return (
    <>
      {/* <Flex justifyContent="space-evenly">
        <Button
          onClick={() => setChangeList(Values.TOTP)}
          style={
            changeList === Values.TOTP
              ? { fontWeight: 'bold' }
              : { fontWeight: 'normal' }
          }
          size="md"
        >
          OTP
        </Button>
        <Button
          onClick={() => setChangeList(Values.passwords)}
          style={
            changeList === Values.passwords
              ? { fontWeight: 'bold' }
              : { fontWeight: 'normal' }
          }
          size="md"
        >
          Passwords
        </Button>
      </Flex> */}

      <Flex overflow="auto" overflowX="hidden" flexDirection="column">
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
            TOTPSecrets.map((auth, i) => {
              return (
                <OtpCode totpData={auth as ITOTPSecret} key={auth.label + i} />
              )
            }),
            LoginCredentials.map((psw, i) => {
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

// .filter(({ originalUrl }) => {
//   if (!currentTabUrl || !originalUrl) {
//     return true
//   }
//   return (
//     extractHostname(originalUrl) === extractHostname(currentTabUrl)
//   )
// })
