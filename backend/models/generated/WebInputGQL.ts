import { Field, ObjectType, Int, GraphQLISODateTime, Ctx } from 'type-graphql'
import { WebInputTypeGQL } from '../types/WebInputType'
import { UserGQL } from './UserGQL'
import { SecretUsageEventGQL } from './SecretUsageEventGQL'
import type { IContextAuthenticated } from 'schemas/RootResolver'
import debug from 'debug'

const log = debug('au:WebInput')
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

  @Field(() => String, { nullable: true })
  addedByUserId: string | null

  @Field(() => Int)
  async delete(@Ctx() ctx: IContextAuthenticated) {
    log('delete of WebInput id: ', this.id)

    return ctx.prisma.webInput.delete({
      where: { id: this.id }
    })
  }
}

@ObjectType()
export class WebInputGQL extends WebInputGQLScalars {
  @Field(() => UserGQL, { nullable: true })
  addedByUser: UserGQL | null

  @Field(() => [SecretUsageEventGQL])
  UsageEvents: SecretUsageEventGQL[]

  // skip overwrite 👇
}
