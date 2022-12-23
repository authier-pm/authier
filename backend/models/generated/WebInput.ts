import { Field, ObjectType, Int } from 'type-graphql'
import { WebInputTypeGQL } from '../types/WebInputType'
import { UserGQL } from './User'
import { SecretUsageEventGQL } from './SecretUsageEvent'
import { Prisma } from '@prisma/client'
import { GraphQLJSON } from 'graphql-scalars'
import GraphQLScalars from 'graphql-scalars'

@ObjectType()
export class WebInputGQLScalars {
  @Field(() => Int)
  id: number

  @Field({ nullable: true })
  layoutType?: string

  @Field()
  createdAt: Date

  @Field()
  host: string

  @Field()
  url: string

  @Field(() => WebInputTypeGQL)
  kind: WebInputTypeGQL

  @Field()
  domPath: string

  @Field(() => Int)
  domOrdinal: number

  @Field(() => GraphQLJSON)
  domCoordinates: Prisma.JsonValue

  @Field()
  addedByUserId: string
}

@ObjectType()
export class WebInputGQL extends WebInputGQLScalars {
  @Field(() => UserGQL)
  addedByUser: UserGQL

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  // skip overwrite 👇
}
