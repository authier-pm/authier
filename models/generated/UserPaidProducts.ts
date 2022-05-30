import { Field, ObjectType, Int } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class UserPaidProductsGQLScalars {
  @Field(() => Int)
  id: number

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field({ nullable: true })
  expiresAt?: Date

  @Field()
  productId: string

  @Field()
  userId: string

  @Field()
  checkoutSessionId: string
}

@ObjectType()
export class UserPaidProductsGQL extends UserPaidProductsGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
