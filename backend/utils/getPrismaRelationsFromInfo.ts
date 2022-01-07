import getFieldNames from 'graphql-list-fields'
import { GraphQLResolveInfo } from 'graphql'
import set from 'lodash.set'

/**
 * @returns prisma object relation mapping that can be passed into prisma query "include" field
 */
export const getPrismaRelationsFromInfo = (
  info: GraphQLResolveInfo,
  prefixFilter?: string
) => {
  // @ts-expect-error
  const queriedFields = getFieldNames(info)

  const forRelations = queriedFields.filter((field) => {
    if (prefixFilter) {
      return (
        field.startsWith(prefixFilter) &&
        field.includes('.') &&
        field[prefixFilter.length + 1].toLowerCase() !==
          field[prefixFilter.length + 1]
      )
    }
    return field.includes('.') && field[0].toLowerCase() !== field[0]
  }) // anything that has a dot in it and capital first letter should be a prisma relation we need to load
  if (forRelations.length === 0) return null

  const res = {}
  for (const fieldName of forRelations) {
    const relations = fieldName.split('.')
    relations.pop()
    if (prefixFilter) {
      relations.shift()
    }
    set(res, relations.join('.include.'), true)
  }

  return res
}
