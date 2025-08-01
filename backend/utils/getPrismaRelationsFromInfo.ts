import getFieldNames from 'graphql-list-fields'
import type { GraphQLResolveInfo } from 'graphql'
import set from 'lodash.set'

import type { DMMF } from '@prisma/client/runtime/library'
import { dmmf } from '../prisma/prismaClient'

/**
 * @returns prisma object relation mapping that can be passed into prisma query "include" field
 */
export const getPrismaRelationsFromGQLInfo = ({
  info,
  rootModel
}: {
  info: GraphQLResolveInfo
  rootModel: DMMF.Model
}) => {
  //@ts-ignore
  const queriedFields = getFieldNames(info)

  const relationsChains = queriedFields
    .filter((field) => field.includes('.'))
    .map((field) => {
      if (field.includes('.')) {
        const relationsChain = field.split('.')
        relationsChain.pop() // last one is always scalar field
        return relationsChain
      }
      return null
    }) // anything that has a dot in it and capital first letter should be a prisma relation we need to load

  if (relationsChains.length === 0) return null

  const prismaInclude = {}
  for (const chain of relationsChains) {
    let lastRelationModel = rootModel
    const path: string[] = []

    for (const singleRelation of chain!) {
      const field = lastRelationModel.fields.find(
        ({ name }) => name === singleRelation
      )
      if (field?.kind !== 'object') {
        break
      }
      lastRelationModel = dmmf.models[field.type as string]
      path.push(singleRelation)
      if (lastRelationModel) {
        set(prismaInclude, path.join('.include.'), true)
      }
    }
  }
  if (Object.keys(prismaInclude).length === 0) {
    return null
  }

  return prismaInclude
}
