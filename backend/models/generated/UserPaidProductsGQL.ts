import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'

@ObjectType()
export class UserPaidProductsGQLScalars {
  @Field(() => Int)
  id: number

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field(() => GraphQLISODateTime, { nullable: true })
  expiresAt: Date | null

  @Field(() => String)
  productId: string

  @Field(() => String)
  userId: string

  @Field(() => String)
  checkoutSessionId: string
}

@ObjectType()
export class UserPaidProductsGQL extends UserPaidProductsGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
