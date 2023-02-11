import { createTRPCProxyClient } from '@trpc/client'
import { AppRouter } from '../background/chromeRuntimeListener'
import { chromeLink } from 'trpc-chrome/link'
import browser from 'webextension-polyfill'

const port = browser.runtime.connect()

// just utility function to get to the return type of the router, prefer to use getTRPCCached() everywhere
export const connectTRPC = () => {
  const trpc = createTRPCProxyClient<AppRouter>({
    // @ts-expect-error
    links: [chromeLink({ port })]
  })
  return trpc
}

let trpcCached: ReturnType<typeof connectTRPC>

export const getTRPCCached = () => {
  if (!trpcCached) {
    trpcCached = connectTRPC()
  }
  return trpcCached
}
