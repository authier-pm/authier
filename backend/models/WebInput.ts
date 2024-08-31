import { Field, ObjectType, Int, GraphQLISODateTime, Ctx } from 'type-graphql'
import { WebInputGQL } from './generated/WebInputGQL'
import debug from 'debug'
import { IContextAuthenticated } from '../schemas/RootResolver'

const log = debug('au:WebInput')

@ObjectType()
export class WebInputMutation extends WebInputGQL {
  @Field(() => Int)
  async delete(@Ctx() ctx: IContextAuthenticated) {
    log('delete of WebInput id: ', this.id)
    // TODO rate limit this to like 1 per hour

    return ctx.prisma.webInput.delete({
      where: { id: this.id }
    })
  }
}
