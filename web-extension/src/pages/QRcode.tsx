import { Box, Flex, Heading } from '@chakra-ui/react'
import { getUserFromToken } from '@src/util/accessToken'
import React, { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

export default function QRcode() {
  const [token, setToken] = useState('')

  useEffect(() => {
    async function token() {
      let obj: any = await getUserFromToken()
      setToken(obj.userId)
    }
    token()
  }, [])

  return (
    <Flex>
      <Heading>Scan with mobile to sync profile</Heading>
      <QRCode value={token} />
    </Flex>
  )
}
