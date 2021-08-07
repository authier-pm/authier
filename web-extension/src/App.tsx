import { Flex } from '@chakra-ui/react'
import { setAccessToken } from '@src/util/accessToken'
import React, { createContext, ReactElement, useEffect, useState } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { Popup } from './popup/Popup'
import Providers from './Providers'

import { getMessaging, onMessage, getToken } from 'firebase/messaging'

const messaging = getMessaging()

const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })

function App(): ReactElement {
  const [loading, setLoading] = useState(true)

  onMessageListener()
    .then((payload) => {
      console.log(payload)
    })
    .catch((err) => console.log('failed: ', err))

  useEffect(() => {
    async function token() {
      let s = await browser.storage.local.get('jid')
      //console.log('s', s)
      setAccessToken(s.jid)
      setLoading(false)
    }
    async function save() {
      let t = await getToken(messaging, {
        vapidKey:
          'BPxh_JmX3cR4Cb6lCYon2cC0iAVlv8dOL1pjX2Q33ROT0VILKuGAlTqG1uH8YZXQRCscLlxqct0XeTiUvF4sy4A'
      })
      console.log('fire: ', t)
    }

    save()
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
