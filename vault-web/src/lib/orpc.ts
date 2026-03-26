import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { vaultApiContract } from '@shared/orpc/contract'
import { apiOrigin } from '@/env'
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
  }
})

export const orpcClient: ContractRouterClient<typeof vaultApiContract> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(orpcClient)
