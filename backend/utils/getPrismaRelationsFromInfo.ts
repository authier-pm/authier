import getFieldNames from 'graphql-list-fields'
import { GraphQLResolveInfo } from 'graphql'

export const getPrismaRelationsFromInfo = (info: GraphQLResolveInfo) => {
  const queriedFields = getFieldNames(info)
  const forRelations = queriedFields.filter((field) => field.includes('.')) // anything that has a dot in it must be a prisma relation we need to load
  const res = {}
  for (const fieldName of forRelations) {
    const [relationName] = fieldName.split('.')
    res[relationName] = true
  }

  return res
}
