import { Field, ObjectType, Ctx } from 'type-graphql'
import { WebInputGQL, WebInputGQLScalars } from './generated/WebInputGQL'
import debug from 'debug'
import type { IContextAuthenticated } from './types/ContextTypes'
import { RedisBasicRateLimiter } from '../lib/RedisBasicRateLimiter'
import { redisClient } from '../lib/redisClient'

const log = debug('au:WebInput')

const rateLimiter = new RedisBasicRateLimiter(redisClient, {
  limiterPrefix: 'web_input_delete',
  maxHits: 1,
  intervalSeconds: 3600
})

@ObjectType()
export class WebInputMutation extends WebInputGQL {
  @Field(() => WebInputGQLScalars, { nullable: true })
  async delete(@Ctx() ctx: IContextAuthenticated) {
    await rateLimiter.increment(ctx.jwtPayload.userId)
    log('delete of WebInput id: ', this.id)

    const res = await ctx.prisma.webInput.delete({
      where: { id: this.id }
    })

    return res
  }
}
