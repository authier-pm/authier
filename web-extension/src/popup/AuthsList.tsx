import React, { useContext, useEffect, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useClipboard
} from '@chakra-ui/react'
import { authenticator } from 'otplib'
import { AuthsContext, IAuth } from './Popup'
import { CopyIcon, ViewIcon } from '@chakra-ui/icons'
import { Tooltip } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { browser } from 'webextension-polyfill-ts'
import { getCurrentTab } from '@src/executeScriptInCurrentTab'
import { extractHostname } from './extractHostname'
const OtpCode = ({ auth }: { auth: IAuth }) => {
  const otpCode = authenticator.generate(auth.secret)

  useEffect(() => {
    setShowWhole(false)
  }, [otpCode])
  const [showWhole, setShowWhole] = useState(false)
  const { onCopy } = useClipboard(otpCode)
  return (
    <Box boxShadow="2xl" p="4" rounded="md" bg="white">
      <Stat>
        <Flex justify="flex-start" align="center">
          <Avatar src={auth.icon} size="sm"></Avatar>
          <Box ml={4} mr="auto">
            <StatLabel>{auth.label}</StatLabel>

            <StatNumber
              onClick={() => {
                setShowWhole(!showWhole)
                if (!showWhole) {
                  // TODO log usage of this key to backend
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
      {auths
        .filter(({ originalUrl }) => {
          if (!currentTabUrl || !originalUrl) {
            return true
          }

          return extractHostname(originalUrl) === extractHostname(currentTabUrl)
        })
        .map((auth, i) => {
          return <OtpCode auth={auth} key={auth.label + i} />
        })}
    </>
  )
}
