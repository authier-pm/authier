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
  Text
} from '@chakra-ui/react'
import { authenticator } from 'otplib'
import { AuthsContext, IAuth } from '../providers/AuthsProvider'
import { CopyIcon, ViewIcon } from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { browser } from 'webextension-polyfill-ts'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import { extractHostname } from '../util/extractHostname'
import { useAddOtpEventMutation } from './AuthList.codegen'
import { getUserFromToken, tokenFromLocalStorage } from '@src/util/accessToken'
import { LockIcon } from '@chakra-ui/icons'

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

export const AuthsList = () => {
  const { auths } = useContext(AuthsContext)

  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)

  useEffect(() => {
    getCurrentTab().then((tab) => {
      console.log('~ tab?.url', tab?.url)

      setCurrentTabUrl(tab?.url ?? null)
    })
  }, [])

  return (
    <>
      {auths ? (
        auths
          .filter(({ originalUrl, secret }) => {
            if (!currentTabUrl || !originalUrl) {
              return true
            }
            return (
              extractHostname(originalUrl) === extractHostname(currentTabUrl)
            )
          })
          .map((auth, i) => {
            return <OtpCode auth={auth} key={auth.label + i} />
          })
      ) : (
        <Flex flexDirection="row" justifyContent="center">
          <LockIcon w={6} h={6} />
          <Text fontSize="md"> Your OTP list is locked</Text>
        </Flex>
      )}
    </>
  )
}
