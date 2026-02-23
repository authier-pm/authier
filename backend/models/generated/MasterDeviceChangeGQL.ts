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

  @Field(() => String)
  oldDeviceId: string

  @Field(() => String)
  newDeviceId: string

  @Field(() => String)
  userId: string
}

@ObjectType()
export class MasterDeviceChangeGQL extends MasterDeviceChangeGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
