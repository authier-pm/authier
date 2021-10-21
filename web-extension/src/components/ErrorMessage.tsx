import React from 'react'
import { Box, Alert, AlertIcon, AlertDescription } from '@chakra-ui/react'

export default function ErrorMessage({ message }) {
  return (
    <Box my={4}>
      <Alert status="error" borderRadius={4}>
        <AlertIcon />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </Box>
  )
}
