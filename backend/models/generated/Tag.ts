import { Field, ID, ObjectType } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class TagGQLScalars {
  @Field(() => ID)
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
