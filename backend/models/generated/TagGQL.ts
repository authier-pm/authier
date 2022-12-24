import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'

@ObjectType()
export class TagGQLScalars {
  @Field(() => Int)
  id: number

  @Field()
  name: string

  @Field(() => GraphQLISODateTime)
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
