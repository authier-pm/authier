import { Field, ID, ObjectType } from 'type-graphql'
import { WebInputTypeGQL } from '../types/WebInputType'
import { UserGQL } from './User'
import { SecretUsageEventGQL } from './SecretUsageEvent'

@ObjectType()
export class WebInputGQL {
  @Field(() => ID)
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

  @Field(() => UserGQL)
  addedByUser: UserGQL

  @Field()
  addedByUserId: string

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  // skip overwrite 👇
}
