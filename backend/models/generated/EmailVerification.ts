import { Field, ObjectType, ID } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class EmailVerificationGQLScalars {
  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field(() => ID)
  userId: string

  @Field()
  token: string
}

@ObjectType()
export class EmailVerificationGQL extends EmailVerificationGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
