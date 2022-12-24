import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { WebInputTypeGQL } from '../types/WebInputType'
import { UserGQL } from './UserGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'
import { Prisma } from '@prisma/client'
import * as GraphQLScalars from 'graphql-scalars'

@ObjectType()
export class WebInputGQLScalars {
  @Field(() => Int)
  id: number

  @Field(() => String, { nullable: true })
  layoutType: string | null

  @Field(() => GraphQLISODateTime)
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

  @Field(() => GraphQLScalars.JSONResolver)
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
