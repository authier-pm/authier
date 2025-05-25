import { initTRPC } from '@trpc/server'

export const tc = initTRPC
  .context<{
    sender: chrome.runtime.MessageSender | undefined
  }>()
  .create({
    isServer: false,
    allowOutsideOfServer: true
  })
