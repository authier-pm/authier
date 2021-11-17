import { Field, ID, ObjectType, Int } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class SettingsConfigGQL {
  @Field(() => ID)
  userId: string

  @Field(() => Int)
  lockTime: number

  @Field()
  twoFA: boolean

  @Field()
  noHandsLogin: boolean

  @Field()
  homeUI: string

  @Field({ nullable: true })
  updatedAt?: Date

  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
