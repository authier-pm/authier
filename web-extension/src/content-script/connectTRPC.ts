import { createTRPCProxyClient } from '@trpc/client'
import { AppRouter } from '../background/chromeRuntimeListener'
import { chromeLink } from '@capaj/trpc-browser/link'
import browser from 'webextension-polyfill'

const port = browser.runtime.connect()

export const trpc = createTRPCProxyClient<AppRouter>({
  // @ts-expect-error
  links: [chromeLink({ port })]
})
