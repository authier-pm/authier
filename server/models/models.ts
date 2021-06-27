import { Field, ID, ObjectType } from 'type-graphql'

@ObjectType()
export class Recipe {
  @Field(() => ID)
  id: string

  @Field(() => String)
  title: string

  @Field(() => Number, { nullable: true })
  averageRating?: number
}

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
export class LoginResponce {
  @Field()
  accessToken: string
}
