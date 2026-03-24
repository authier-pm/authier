import { initTRPC } from '@trpc/server'
import type { Runtime } from 'webextension-polyfill'

export const tc = initTRPC
  .context<{
    sender: Runtime.MessageSender | undefined
  }>()
  .create({
    isServer: false,
    allowOutsideOfServer: true
  })
