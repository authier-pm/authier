import { Field, ObjectType, Int } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class TagGQLScalars {
  @Field(() => Int)
  id: number

  @Field()
  name: string

  @Field()
  createdAt: Date

  @Field()
  userId: string
}

@ObjectType()
export class TagGQL extends TagGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
