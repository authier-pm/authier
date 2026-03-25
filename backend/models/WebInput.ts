import { Field, ObjectType, Ctx } from 'type-graphql'
import { WebInputGQL, WebInputGQLScalars } from './generated/WebInputGQL'
import debug from 'debug'
import type { IContextAuthenticated } from './types/ContextTypes'
import { RedisBasicRateLimiter } from '../lib/RedisBasicRateLimiter'
import { redisClient } from '../lib/redisClient'
import { webInput } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

const log = debug('au:WebInput')

const rateLimiter = new RedisBasicRateLimiter(redisClient, {
  limiterPrefix: 'web_input_delete',
  maxHits: 1,
  intervalSeconds: 5
})

@ObjectType()
export class WebInputMutation extends WebInputGQL {
  @Field(() => WebInputGQLScalars, { nullable: true })
  async delete(@Ctx() ctx: IContextAuthenticated) {
    const isSameUser = ctx.jwtPayload.userId === this.addedByUserId
    if (!isSameUser) {
      await rateLimiter.increment(ctx.jwtPayload.userId)
    }
    const res = await ctx.db
      .delete(webInput)
      .where(eq(webInput.id, this.id))
      .returning()
    log('deleted WebInput id: ', this.id)

    return res[0]
  }
}
