import getFieldNames from 'graphql-list-fields'
import { GraphQLResolveInfo } from 'graphql'
import set from 'lodash.set'

/**
 * @returns prisma object relation mapping that can be passed into prisma query "include" field
 */
export const getPrismaRelationsFromInfo = (info: GraphQLResolveInfo) => {
  const queriedFields = getFieldNames(info)
  const forRelations = queriedFields.filter((field) => field.includes('.')) // anything that has a dot in it must be a prisma relation we need to load
  const res = {}
  for (const fieldName of forRelations) {
    const relations = fieldName.split('.')
    relations.pop()
    set(res, relations.join('.include.'), true)
  }

  return res
}
