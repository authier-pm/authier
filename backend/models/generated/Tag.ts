import { Field, ID, ObjectType } from 'type-graphql'
import { UserGQL } from './User'

@ObjectType()
export class TagGQL {
  @Field(() => ID)
  id: number

  @Field()
  name: string

  @Field()
  createdAt: Date

  @Field(() => UserGQL)
  user: UserGQL

  @Field()
  userId: string

  // skip overwrite 👇
}
