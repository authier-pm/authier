import React, { FunctionComponent, useEffect } from 'react'

import { browser } from 'webextension-polyfill-ts'

import { Box, ChakraProvider, Grid } from '@chakra-ui/react'
import { Hello } from '@src/components/hello/component'
import { Scroller } from '@src/components/scroller/component'

export const Popup: FunctionComponent = () => {
  useEffect(() => {
    browser.runtime.sendMessage({ popupMounted: true })
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
