import { ApolloCache } from '@apollo/client'
import { persistCache } from 'apollo3-cache-persist'

import { ApolloCacheStorage } from '../utils/storage'

type PersistCacheCompat = (options: {
  cache: ApolloCache
  storage: ApolloCacheStorage
}) => Promise<void>

// In this monorepo, apollo3-cache-persist can resolve against a different @apollo/client
// package instance than the mobile app, which makes identical Apollo types incompatible.
const persistCacheCompat = persistCache as unknown as PersistCacheCompat

export const persistApolloCache = (
  cache: ApolloCache,
  storage: ApolloCacheStorage
) => {
  return persistCacheCompat({
    cache,
    storage
  })
}
