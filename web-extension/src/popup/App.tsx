import { Flex } from '@chakra-ui/react'
import { setAccessToken } from '@src/util/accessToken'
import React, { ReactElement, useEffect, useState } from 'react'
import { Popup } from './Popup'

interface Props {}

function App(): ReactElement {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:5050/refresh_token', {
      method: 'POST',
      credentials: 'include'
    }).then(async (x) => {
      const { accessToken } = await x.json()
      console.log(accessToken)
      setAccessToken(accessToken)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <Flex>Loading...</Flex>
  }

  return <Popup />
}

export default App
