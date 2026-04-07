import {
  createORPCClient,
  createORPCErrorFromJson,
  isORPCErrorJson,
  ORPCError
} from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { ContractRouterClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { vaultApiContract } from '@shared/orpc/contract'
import { apiOrigin } from '@/env'
import { notifyUnauthorizedSession } from './authEvents'
import { getAccessToken } from './accessToken'

const getOrpcError = (value: unknown) => {
  if (value instanceof ORPCError) {
    return value
  }

  if (isORPCErrorJson(value)) {
    return createORPCErrorFromJson(value)
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'json' in value &&
    isORPCErrorJson(value.json)
  ) {
    return createORPCErrorFromJson(value.json)
  }

  return null
}

export const getUnauthorizedSessionError = (value: unknown) => {
  const error = getOrpcError(value)

  if (!error || (error.code !== 'UNAUTHORIZED' && error.status !== 401)) {
    return null
  }

  return error
}

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
        const result = await next()
        const unauthorizedError = getUnauthorizedSessionError(result)

        if (unauthorizedError) {
          notifyUnauthorizedSession()
          throw unauthorizedError
        }

        return result
      } catch (error) {
        const unauthorizedError = getUnauthorizedSessionError(error)

        if (unauthorizedError) {
          notifyUnauthorizedSession()
          throw unauthorizedError
        }

        throw error
      }
    }
  ]
})

export const orpcClient: ContractRouterClient<typeof vaultApiContract> =
  createORPCClient(link)

export const orpc = createTanstackQueryUtils(orpcClient)
