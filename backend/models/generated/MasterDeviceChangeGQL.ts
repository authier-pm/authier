import { Field, ObjectType, ID, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'

@ObjectType()
export class MasterDeviceChangeGQLScalars {
  @Field(() => ID)
  id: string

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime)
  processAt: Date

  @Field()
  oldDeviceId: string

  @Field()
  newDeviceId: string

  @Field()
  userId: string
}

@ObjectType()
export class MasterDeviceChangeGQL extends MasterDeviceChangeGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
