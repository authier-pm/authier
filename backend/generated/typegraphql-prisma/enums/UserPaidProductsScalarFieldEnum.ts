import * as TypeGraphQL from 'type-graphql'

export enum UserPaidProductsScalarFieldEnum {
  id = 'id',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  expiresAt = 'expiresAt',
  productId = 'productId',
  userId = 'userId',
  checkoutSessionId = 'checkoutSessionId'
}
TypeGraphQL.registerEnumType(UserPaidProductsScalarFieldEnum, {
  name: 'UserPaidProductsScalarFieldEnum',
  description: undefined
})
