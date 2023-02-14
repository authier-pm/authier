import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { WebInputTypeGQL } from '../types/WebInputType'
import { UserGQL } from './UserGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'
import * as GraphQLScalars from 'graphql-scalars'
import { ICoordinates } from 'models/WebInputElement'
import { Prisma } from '.prisma/client'

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

  @Field(() => String, { nullable: true })
  addedByUserId: string | null
}

@ObjectType()
export class WebInputGQL extends WebInputGQLScalars {
  @Field(() => UserGQL, { nullable: true })
  addedByUser: UserGQL | null

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  // skip overwrite 👇
}
