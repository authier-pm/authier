import { Flex } from '@chakra-ui/react'
import { setAccessToken } from '@src/util/accessTokenExtension'
import React, { ReactElement, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'

import Providers from './Providers'

function App({ parent }: { parent: string }): ReactElement {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function token() {
      const s = await browser.storage.local.get('access-token')

      setAccessToken(s['access-token'])
      setLoading(false)
    }

    token()
  }, [])

  if (loading) {
    return <Flex>Loading...</Flex>
  }

  return <Providers parent={parent} />
}

export default App
