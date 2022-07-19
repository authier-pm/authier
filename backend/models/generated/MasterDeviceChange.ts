import { Field, ObjectType, ID } from 'type-graphql'

import { UserGQL } from './User'

@ObjectType()
export class MasterDeviceChangeGQLScalars {
  @Field(() => ID)
  id: string

  @Field()
  createdAt: Date

  @Field()
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
