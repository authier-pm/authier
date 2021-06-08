import { Box, Center, Heading } from '@chakra-ui/layout'
import React, { FunctionComponent } from 'react'

export const Hello: FunctionComponent = () => {
  return (
    <Box>
      <Center>
        <Heading size="m" mt={3}>
          Example Extension
        </Heading>
      </Center>
    </Box>
  )
}
