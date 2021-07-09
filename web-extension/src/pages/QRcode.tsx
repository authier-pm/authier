import { Box, Button, Flex, Heading } from '@chakra-ui/react'
import { getUserFromToken } from '@src/util/accessToken'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { useDeviceCountQuery } from './QRcode.codegen'
import { useLocation } from 'wouter'
import { ArrowForwardIcon } from '@chakra-ui/icons'

export default function QRcode() {
  const [interval, setInterval] = useState<number>(500)
  const [location, setLocation] = useLocation()
  const [token, setToken] = useState('')
  const { data, error, startPolling, stopPolling } = useDeviceCountQuery({
    variables: { userId: token }
  })
  const [count, setCount] = useState<number | undefined>()

  useEffect(() => {
    async function GetToken() {
      let obj: any = await getUserFromToken()
      setToken(obj.userId)
      startPolling(interval)
    }
    if (!token) {
      console.log('SaveToken')
      GetToken()
    }

    setCount(data?.DeviceCount)
    //@ts-expect-error
    if (typeof count !== undefined && data?.DeviceCount > count) {
      stopPolling()
      setLocation('/')
    }
  }, [data])

  return (
    <Flex flexDirection="column" alignItems="center">
      <Heading as="h3" size="lg">
        Scan QR code in app
      </Heading>
      <QRCode size={200} value={token} />
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
