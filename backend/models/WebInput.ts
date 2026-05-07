import { Field, ObjectType, Ctx } from 'type-graphql'
import { WebInputGQL, WebInputGQLScalars } from './generated/WebInputGQL'
import debug from 'debug'
import type { IContextAuthenticated } from './types/ContextTypes'
import { RedisBasicRateLimiter } from '../lib/RedisBasicRateLimiter'
import { redisClient } from '../lib/redisClient'
import { webInput } from '../drizzle/schema'
import { eq } from 'drizzle-orm'
import { GraphqlError } from '../lib/GraphqlError'
import {
  isOldEnoughToRemoveWebInputs,
  shouldApplyFreeUserRateLimit
} from './accountLimits'

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
    const deletingUser = await ctx.db.query.user.findFirst({
      where: { id: ctx.jwtPayload.userId },
      columns: {
        createdAt: true,
        loginCredentialsLimit: true,
        TOTPlimit: true
      }
    })

    if (!deletingUser) {
      throw new GraphqlError('User not found')
    }

    if (!isOldEnoughToRemoveWebInputs(deletingUser)) {
      throw new GraphqlError(
        'You can remove saved autofill inputs after your account is at least 1 week old.'
      )
    }

    const isSameUser = ctx.jwtPayload.userId === this.addedByUserId
    if (!isSameUser && shouldApplyFreeUserRateLimit(deletingUser)) {
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
