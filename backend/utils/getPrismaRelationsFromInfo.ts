import getFieldNames from 'graphql-list-fields'
import { GraphQLResolveInfo } from 'graphql'
import set from 'lodash.set'

import { DMMF } from '@prisma/client/runtime'
import { dmmf } from '../prisma/prismaClient'

/**
 * @returns prisma object relation mapping that can be passed into prisma query "include" field
 */
export const getPrismaRelationsFromInfo = ({
  info,
  rootModel
}: {
  info: GraphQLResolveInfo
  rootModel: DMMF.Model
}) => {
  const queriedFields = getFieldNames(info)

  const relationsChains = queriedFields
    .filter((field) => field.includes('.'))
    .map((field) => {
      if (field.includes('.')) {
        const relationsChain = field.split('.')
        relationsChain.pop() // last one is always scalar field
        return relationsChain
      }
    }) // anything that has a dot in it and capital first letter should be a prisma relation we need to load

  if (relationsChains.length === 0) return null

  const prismaInclude = {}
  for (const chain of relationsChains) {
    let lastRelationModel = rootModel
    let path: string[] = []

    for (const singleRelation of chain!) {
      const field = lastRelationModel.fields.find(
        ({ name }) => name === singleRelation
      )
      if (field?.kind !== 'object') {
        break
      }
      lastRelationModel = dmmf.modelMap[field.type as string]
      path.push(singleRelation)
      if (lastRelationModel) {
        set(prismaInclude, path.join('.include.'), true)
      }
    }
  }
  if (Object.keys(prismaInclude).length === 0) {
    return null
  }
  console.log('~ prismaInclude', prismaInclude)

  return prismaInclude
}
