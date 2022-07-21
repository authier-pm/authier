import { Field, ObjectType, ID, Int } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class SettingsConfigGQLScalars {
  @Field(() => ID)
  userId: string

  @Field(() => Int)
  lockTime: number

  @Field()
  twoFA: boolean

  @Field()
  autofill: boolean

  @Field()
  language: string

  @Field({ nullable: true })
  updatedAt?: Date
}

@ObjectType()
export class SettingsConfigGQL extends SettingsConfigGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
