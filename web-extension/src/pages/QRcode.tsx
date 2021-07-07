import { Box, Flex, Heading } from '@chakra-ui/react'
import { getUserFromToken } from '@src/util/accessToken'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { useDeviceCountQuery } from './QRcode.codegen'

export default function QRcode() {
  const [token, setToken] = useState('')
  const [interval, setInterval] = useState<number>(500)
  const { data, loading, error, startPolling, stopPolling } =
    useDeviceCountQuery({
      variables: { userId: token }
    })
  //const [count, setCount] = useState(data?.DeviceCount)
  startPolling(1000)

  useEffect(() => {
    async function token() {
      let obj: any = await getUserFromToken()
      setToken(obj.userId)
    }
    token()
    console.log(data)
  }, [data])

  return (
    <Flex flexDirection="column">
      {/* <Heading size="md" as="h3">
        Scan with mobile to sync profile
      </Heading> */}
      <QRCode value={token} />
    </Flex>
  )
}
