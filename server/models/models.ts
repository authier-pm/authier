import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export class User {
  @Field(() => String)
  id: string

  @Field(() => String)
  email: string

  @Field(() => String)
  password: string

  @Field(() => Number)
  tokenVersion: number
}

@ObjectType()
export class LoginResponse {
  @Field(() => String)
  accessToken: string
}
