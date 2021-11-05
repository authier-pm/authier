import * as TypeGraphQL from 'type-graphql'

export enum TagScalarFieldEnum {
  id = 'id',
  name = 'name',
  createdAt = 'createdAt',
  userId = 'userId'
}
TypeGraphQL.registerEnumType(TagScalarFieldEnum, {
  name: 'TagScalarFieldEnum',
  description: undefined
})
