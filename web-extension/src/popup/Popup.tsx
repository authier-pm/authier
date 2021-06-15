import React, { FunctionComponent, useEffect } from 'react'

import { browser } from 'webextension-polyfill-ts'

import {
  Avatar,
  Box,
  Button,
  ChakraProvider,
  Flex,
  Grid,
  Heading,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react'

import { authenticator } from 'otplib'
import { Trans } from '@lingui/macro'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { executeScriptInCurrentTab } from '@src/executeScriptInCurrentTab'
import { sharedBrowserEvents } from '@src/backgroundPage'
i18n.activate('en')

const auths = [
  {
    secret: 'JBSWY3DPEHPK3PXP',
    label: 'bitfinex',
    icon: 'https://chakra-ui.com/favicon.png'
  }
]
export const Popup: FunctionComponent = () => {
  useEffect(() => {
    browser.runtime.sendMessage({ popupMounted: true })

    browser.runtime.onMessage.addListener(function (request: {
      message: sharedBrowserEvents
      url: any
    }) {
      // listen for messages sent from background.js
      if (request.message === sharedBrowserEvents.URL_CHANGED) {
        console.log('new url', request.url) // new url is now in content scripts!
      }
    })
  }, [])

  return (
    <ChakraProvider>
      <I18nProvider i18n={i18n}>
        <Box height={200} width={300} p={5}>
          <Grid gap={3}>
            <Heading>
              <Trans>Your codes</Trans>
            </Heading>
            {auths.map((oauth) => {
              return (
                <Box boxShadow="2xl" p="4" rounded="md" bg="white">
                  <Stat>
                    <Flex justify="space-around">
                      <Avatar src={oauth.icon}></Avatar>
                      <Box ml={4}>
                        <StatLabel>{oauth.label}</StatLabel>
                        <StatNumber>
                          {authenticator.generate(oauth.secret)}
                        </StatNumber>
                      </Box>
                    </Flex>
                  </Stat>
                </Box>
              )
            })}

            <Button
              m={3}
              className="btn btn-block btn-outline-dark"
              onClick={async () =>
                console.log(await executeScriptInCurrentTab('location.href'))
              }
            >
              Add new code
            </Button>
          </Grid>
        </Box>
      </I18nProvider>
    </ChakraProvider>
  )
}

// ;[
//   {
//     site: 'bitfinex.com',
//     secret: 'JBSWY3DPEHPK3PXP'
//   },
//   {
//     site: 'bitfinex.com',
//     icon: null,
//     secret: 'JBSWY3DPEHPK3PXP'
//   }
// ]
