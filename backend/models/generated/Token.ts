import { Field, ID, ObjectType } from 'type-graphql'
import { TokenTypeGQL } from '../types/TokenType'
import { UserGQL } from './User'

@ObjectType()
export class TokenGQL {
  @Field(() => ID)
  id: number

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field(() => TokenTypeGQL)
  type: TokenTypeGQL

  @Field({ nullable: true })
  emailToken?: string

  @Field()
  valid: boolean

  @Field()
  expiration: Date

  @Field(() => UserGQL)
  user: UserGQL

  @Field()
  userId: string

  // skip overwrite 👇
}
