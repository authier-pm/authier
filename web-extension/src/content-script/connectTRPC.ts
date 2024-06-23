import { createTRPCProxyClient } from '@trpc/client'
import { AppRouter } from '../background/chromeRuntimeListener'
import { chromeLink } from '@capaj/trpc-browser/link'
import browser from 'webextension-polyfill'

const connectTRPC = () => {
  const port = browser.runtime.connect()

  trpc = createTRPCProxyClient<AppRouter>({
    // @ts-expect-error
    links: [chromeLink({ port })]
  })

  port.onDisconnect.addListener(() => {
    connectTRPC() // recursively call to reconnect
  })

  return trpc
}

const port = browser.runtime.connect()

export let trpc = createTRPCProxyClient<AppRouter>({
  // @ts-expect-error
  links: [chromeLink({ port })]
})

port.onDisconnect.addListener(() => {
  connectTRPC() // recursively call to reconnect
})
