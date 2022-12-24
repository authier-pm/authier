import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { TokenTypeGQL } from '../types/TokenType'
import { UserGQL } from './UserGQL'

@ObjectType()
export class TokenGQLScalars {
  @Field(() => Int)
  id: number

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field(() => TokenTypeGQL)
  type: TokenTypeGQL

  @Field(() => String, { nullable: true })
  emailToken: string | null

  @Field()
  valid: boolean

  @Field(() => GraphQLISODateTime)
  expiration: Date

  @Field()
  userId: string
}

@ObjectType()
export class TokenGQL extends TokenGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
