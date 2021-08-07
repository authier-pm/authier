import { Flex } from '@chakra-ui/react'
import { setAccessToken } from '@src/util/accessToken'
import React, { createContext, ReactElement, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Popup } from './popup/Popup'
import Providers from './Providers'

function App(): ReactElement {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function token() {
      let s = await browser.storage.local.get('jid')
      //console.log('s', s)
      setAccessToken(s.jid)
      setLoading(false)
    }

    token()
  }, [])

  if (loading) {
    return <Flex>Loading...</Flex>
  }

  return <Providers />
}

export default App

// fetch('http://localhost:5051/refresh_token', {
//   method: 'POST',
//   credentials: 'include'
// }).then(async (x) => {
//   const { accessToken } = await x.json()
//   setAccessToken(accessToken)
//   setLoading(false)
// })

// async function token() {
//   let s = await browser.storage.local.get('jid')
//   setAccessToken(s.jid)
//   setLoading(false)
// }
// token()
