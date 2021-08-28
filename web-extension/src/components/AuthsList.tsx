import React, { useContext, useEffect, useState } from 'react'
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
  Heading
} from '@chakra-ui/react'
import { authenticator } from 'otplib'
import { AuthsContext, IAuth } from '../providers/AuthsProvider'
import { CopyIcon } from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { browser } from 'webextension-polyfill-ts'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import { extractHostname } from '../util/extractHostname'
import { useAddOtpEventMutation } from './AuthList.codegen'
import { getUserFromToken } from '@src/util/accessToken'
import { Passwords, useBackground } from '@src/util/useBackground'
import { UIOptions } from './setting-screens/UI'

enum Values {
  passwords = 'PSW',
  TOTP = 'OTP'
}

const OtpCode = ({ auth }: { auth: IAuth }) => {
  const [addOTPEvent, { data, loading, error }] = useAddOtpEventMutation() //ignore results??
  const otpCode = authenticator.generate(auth.secret)

  const [showWhole, setShowWhole] = useState(false)
  const { onCopy } = useClipboard(otpCode)

  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])

  return (
    <Box boxShadow="2xl" p="4" rounded="md" bg="white">
      <Stat>
        <Flex justify="flex-start" align="center">
          <Avatar src={auth.icon} size="sm"></Avatar>
          <Box ml={4} mr="auto">
            <StatLabel>{auth.label}</StatLabel>

            <StatNumber
              onClick={async () => {
                setShowWhole(!showWhole)
                if (!showWhole) {
                  // CHECK
                  let tabs = await browser.tabs.query({ active: true })

                  let url = tabs[0].url as string
                  let unecryptedToken: any = await getUserFromToken()

                  await addOTPEvent({
                    variables: {
                      kind: 'show OTP',
                      url: url,
                      userId: unecryptedToken.userId as string
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

const Credentials = ({ psw }: { psw: Passwords }) => {
  return (
    <Box p="4" rounded="md" bg="white">
      <Stat>
        <Flex justify="flex-start" align="center">
          <Avatar src={psw.icon} size="sm"></Avatar>
          <Box ml={4} mr="auto">
            <Heading size="sm">{psw.label}</Heading>
            <Text fontSize="lg">{psw.username}</Text>
          </Box>

          <Button
            size="md"
            ml={2}
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
    </Box>
  )
}

export const AuthsList = () => {
  const [changeList, setChangeList] = useState<Values>(Values.TOTP)
  const { auths } = useContext(AuthsContext)
  const { bgPasswords, UIConfig } = useBackground()

  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)

  useEffect(() => {
    getCurrentTab().then((tab) => {
      console.log('~ tab?.url', tab?.url)

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

      <Flex overflow="auto" flexDirection="column" maxHeight={150}>
        {UIConfig.homeList === UIOptions.all && auths && bgPasswords
          ? [
              auths.map((auth, i) => {
                return <OtpCode auth={auth} key={auth.label + i} />
              }),
              bgPasswords.map((psw, i) => {
                return <Credentials psw={psw} key={psw.label + i} />
              })
            ]
          : UIConfig.homeList === UIOptions.byDomain && auths && bgPasswords
          ? [
              auths
                .filter(({ originalUrl }) => {
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
                .filter(({ originalUrl }) => {
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
            auths &&
            bgPasswords &&
            changeList === Values.TOTP
          ? auths.map((auth, i) => {
              return <OtpCode auth={auth} key={auth.label + i} />
            })
          : UIConfig.homeList === UIOptions.loginAndTOTP &&
            auths &&
            bgPasswords &&
            changeList === Values.passwords
          ? bgPasswords.map((psw, i) => {
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
