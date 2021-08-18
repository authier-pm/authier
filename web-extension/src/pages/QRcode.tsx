import { Box, Button, Flex, Heading } from '@chakra-ui/react'
import { getUserFromToken } from '@src/util/accessToken'
import React, { useContext, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { useDeviceCountQuery } from './QRcode.codegen'
import { useLocation } from 'wouter'
import { ArrowForwardIcon } from '@chakra-ui/icons'
import { UserContext } from '@src/providers/UserProvider'
import { useIsLoggedInQuery } from '@src/popup/Popup.codegen'

export default function QRcode() {
  const [interval, setInterval] = useState<number>(500)
  const [location, setLocation] = useLocation()
  const [count, setCount] = useState<number>(1)
  const { userId } = useContext(UserContext)
  const { data, error, startPolling, stopPolling } = useDeviceCountQuery({
    variables: { userId: userId as string }
  })

  useEffect(() => {
    startPolling(interval)
  }, [])

  useEffect(() => {
    const devicesCount = data?.devicesCount ?? 0

    if (typeof count !== undefined && devicesCount > count) {
      stopPolling()
      setLocation('/')
    }
  }, [data])

  return (
    <Flex flexDirection="column" alignItems="center">
      <Heading as="h3" size="lg">
        Scan QR code in app
      </Heading>
      <QRCode size={200} value={userId as string} />
      <Button
        variant="outline"
        onClick={() => {
          stopPolling()
          setLocation('/')
        }}
        leftIcon={<ArrowForwardIcon />}
      >
        Skip
      </Button>
    </Flex>
  )
}
