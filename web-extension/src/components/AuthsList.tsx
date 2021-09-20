import React, { useContext, useEffect, useRef, useState } from 'react'
import {
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
  IconButton
} from '@chakra-ui/react'
import { authenticator } from 'otplib'
import { AuthsContext, IAuth } from '../providers/AuthsProvider'
import { CopyIcon, DeleteIcon } from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import browser from 'webextension-polyfill'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import { extractHostname } from '../util/extractHostname'
import { useAddOtpEventMutation } from './AuthList.codegen'
import { getUserFromToken } from '@src/util/accessTokenExtension'
import {
  ILoginCredentials,
  useBackgroundState
} from '@src/util/useBackgroundState'
import { UIOptions } from './setting-screens/SettingsForm'
import RemoveAlertDialog from './RemoveAlertDialog'
import { BackgroundContext } from '@src/providers/BackgroundProvider'

enum Values {
  passwords = 'PSW',
  TOTP = 'OTP'
}

const OtpCode = ({ auth }: { auth: IAuth }) => {
  const { saveAuthsToBg, bgAuths } = useContext(BackgroundContext)
  const [addOTPEvent, { data, loading, error }] = useAddOtpEventMutation() //ignore results??
  const otpCode = authenticator.generate(auth.secret)
  const [showWhole, setShowWhole] = useState(false)
  const { onCopy } = useClipboard(otpCode)
  const [isOpen, setIsOpen] = useState(false)
  const cancelRef = useRef()
  const onClose = () => {
    setIsOpen(false)
    saveAuthsToBg(bgAuths?.filter((i) => i.originalUrl !== auth.originalUrl))
  }

  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])

  return (
    <Box boxShadow="2xl" p="4" rounded="md" bg="white">
      <Stat>
        <Flex justify="flex-start" align="center">
          <Flex flexDirection="column">
            <IconButton
              colorScheme="red"
              aria-label="Delete item"
              icon={<DeleteIcon />}
              size="sm"
              variant="link"
              position="absolute"
              zIndex="overlay"
              top={-1}
              left={-15}
              onClick={() => setIsOpen(true)}
            />

            <RemoveAlertDialog
              isOpen={isOpen}
              cancelRef={cancelRef}
              onClose={onClose}
            />

            <Avatar src={auth.icon} size="sm"></Avatar>
          </Flex>
          <Box ml={4} mr="auto">
            <StatLabel>{auth.label}</StatLabel>

            <StatNumber
              onClick={async () => {
                setShowWhole(!showWhole)
                if (!showWhole) {
                  // CHECK
                  let tabs = await browser.tabs.query({ active: true })

                  let url = tabs[0].url as string
                  let unencryptedToken: any = await getUserFromToken()

                  await addOTPEvent({
                    variables: {
                      kind: 'show OTP',
                      url: url,
                      userId: unencryptedToken.userId as string
                    }
                  })
                  console.log(data, error)
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
        </Flex>
      </Stat>
    </Box>
  )
}

const Credentials = ({ psw }: { psw: ILoginCredentials }) => {
  const { savePasswordsToBg, bgPasswords } = useContext(BackgroundContext)
  const [isOpen, setIsOpen] = useState(false)
  const cancelRef = useRef()
  const onClose = () => {
    setIsOpen(false)
    savePasswordsToBg(
      bgPasswords?.filter((i) => i.originalUrl !== psw.originalUrl)
    )
  }

  return (
    <Flex key={psw.originalUrl} p="3" rounded="md" bg="white" minW="300px">
      <Stat maxW="100%">
        <Flex justify="space-between" align="center" w="100%">
          <Flex flexDirection="column">
            <IconButton
              colorScheme="red"
              aria-label="Delete item"
              icon={<DeleteIcon />}
              size="sm"
              variant="link"
              position="absolute"
              zIndex="overlay"
              top={-1}
              left={-15}
              onClick={() => setIsOpen(true)}
            />

            <RemoveAlertDialog
              isOpen={isOpen}
              cancelRef={cancelRef}
              onClose={onClose}
            />

            <Avatar src={psw.icon} size="xs"></Avatar>
          </Flex>
          <Box ml={2} mr="auto" maxW="200px">
            <Heading size="sm">{psw.label}</Heading>
            <Text fontSize="sm">{psw.username.substr(0, 50)}</Text>
          </Box>

          <Button
            size="md"
            ml="auto"
            variant="outline"
            onClick={() => {
              //onCopy()
              // TODO log usage of this token to backend
            }}
          >
            <CopyIcon></CopyIcon>
          </Button>
        </Flex>
      </Stat>
    </Flex>
  )
}

export const AuthsList = () => {
  const [changeList, setChangeList] = useState<Values>(Values.TOTP)
  const { bgPasswords, UIConfig, bgAuths } = useContext(BackgroundContext)
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)

  useEffect(() => {
    getCurrentTab().then((tab) => {
      setCurrentTabUrl(tab?.url ?? null)
    })
  }, [])

  return (
    <>
      <Flex justifyContent="space-evenly">
        {UIConfig.homeList === UIOptions.loginAndTOTP
          ? [
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
              </Button>,
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
            ]
          : null}
      </Flex>

      <Flex overflow="auto" overflowX="hidden" flexDirection="column">
        {UIConfig.homeList === UIOptions.all
          ? [
              bgAuths?.map((auth, i) => {
                return <OtpCode auth={auth} key={auth.label + i} />
              }),
              bgPasswords?.map((psw, i) => {
                return <Credentials psw={psw} key={psw.label + i} />
              })
            ]
          : UIConfig.homeList === UIOptions.byDomain
          ? [
              bgAuths
                ?.filter(({ originalUrl }) => {
                  if (!currentTabUrl || !originalUrl) {
                    return true
                  }
                  return (
                    extractHostname(originalUrl) ===
                    extractHostname(currentTabUrl)
                  )
                })
                .map((auth, i) => {
                  return <OtpCode auth={auth} key={auth.label + i} />
                }),
              bgPasswords
                ?.filter(({ originalUrl }) => {
                  if (!currentTabUrl || !originalUrl) {
                    return true
                  }
                  return (
                    extractHostname(originalUrl) ===
                    extractHostname(currentTabUrl)
                  )
                })
                .map((psw, i) => {
                  return <Credentials psw={psw} key={psw.label + i} />
                })
            ]
          : UIConfig.homeList === UIOptions.loginAndTOTP &&
            changeList === Values.TOTP
          ? bgAuths?.map((auth, i) => {
              return <OtpCode auth={auth} key={auth.label + i} />
            })
          : UIConfig.homeList === UIOptions.loginAndTOTP &&
            changeList === Values.passwords
          ? bgPasswords?.map((psw, i) => {
              return <Credentials psw={psw} key={psw.label + i} />
            })
          : null}
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
