import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { vaultApiContract } from '@shared/orpc/contract'
import { apiOrigin } from '@/env'
import { notifyUnauthorizedSession } from './authEvents'
import { getAccessToken } from './accessToken'

const link = new RPCLink({
  url: `${apiOrigin}/rpc`,
  headers: () => {
    const token = getAccessToken()

    return token
      ? {
          authorization: `Bearer ${token}`
        }
      : {}
  },
  interceptors: [
    async ({ next }) => {
      try {
        return await next()
      } catch (error) {
        if (
          error instanceof ORPCError &&
          (error.code === 'UNAUTHORIZED' || error.status === 401)
        ) {
          notifyUnauthorizedSession()
        }

        throw error
      }
    }
  ]
})

export const orpcClient: ContractRouterClient<typeof vaultApiContract> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(orpcClient)
