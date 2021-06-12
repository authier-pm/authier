import React, { FunctionComponent, useEffect } from 'react'

import { browser } from 'webextension-polyfill-ts'

import { Box, ChakraProvider, Grid } from '@chakra-ui/react'
import { Hello } from '@src/components/hello/component'
import { Scroller } from '@src/components/scroller/component'
import { authenticator } from 'otplib'
export const Popup: FunctionComponent = () => {
  useEffect(() => {
    browser.runtime.sendMessage({ popupMounted: true })

    const auth = authenticator.generate('JBSWY3DPEHPK3PXP')
    console.log(authenticator.generate('JBSWY3DPEHPK3PXP'))
    console.log('auth', authenticator.generate('JBSWY3DPEHPK3PXP'))
    console.log(authenticator.generateSecret())
  }, [])

  return (
    <ChakraProvider>
      <Box height={200} width={300}>
        <Grid gap={3}>
          <Hello />

          <Scroller />
        </Grid>
      </Box>
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
