import { initTRPC } from '@trpc/server'

export const tc = initTRPC.create({
  isServer: false,
  allowOutsideOfServer: true
})
