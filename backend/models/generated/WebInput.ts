import { Field, ObjectType, Int } from 'type-graphql'
import { WebInputTypeGQL } from '../types/WebInputType'
import { UserGQL } from './User'
import { SecretUsageEventGQL } from './SecretUsageEvent'

@ObjectType()
export class WebInputGQLScalars {
  @Field(() => Int)
  id: number

  @Field({ nullable: true })
  layoutType?: string

  @Field()
  createdAt: Date

  @Field()
  url: string

  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL

  @Field()
  domPath: string

  @Field()
  addedByUserId: string
}

@ObjectType()
export class WebInputGQL extends WebInputGQLScalars {
  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL

  @Field(() => UserGQL)
  addedByUser: UserGQL

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  // skip overwrite 👇
}
