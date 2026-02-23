import getFieldNames from 'graphql-list-fields'
import type { GraphQLResolveInfo } from 'graphql'
import set from 'lodash.set'

/**
 * @deprecated This utility relied on Prisma's DMMF metadata. With Drizzle, relation loading
 * is handled via the `with` option in RQB queries. This function is kept as a stub
 * for backward compatibility but should be removed once all callers are migrated.
 *
 * @returns null — callers should use Drizzle's `with` option directly
 */
export const getPrismaRelationsFromGQLInfo = ({
  info,
  rootModel
}: {
  info: GraphQLResolveInfo
  rootModel: unknown
}) => {
  // With Drizzle, we no longer use DMMF-based relation discovery.
  // Relations should be specified explicitly via `with` in query options.
  return null
}
