import { Field, ID, ObjectType } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class UserPaidProductsGQL {
  @Field(() => ID)
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

  @Field(() => UserGQL)
  user: UserGQL

  @Field()
  checkoutSessionId: string

  // skip overwrite 👇
}
