import { Ctx, Field, Int, ObjectType } from 'type-graphql'
import { IContextAuthenticated } from '../schemas/RootResolver'
import { DecryptionChallengeGQL } from './generated/DecryptionChallenge'

@ObjectType()
export class DecryptionChallengeForApproval {
  @Field(() => Int)
  id: number

  @Field({ nullable: true })
  approvedAt?: Date
}

@ObjectType()
export class DecryptionChallengeMutation extends DecryptionChallengeGQL {
  @Field(() => DecryptionChallengeGQL)
  async approve(@Ctx() ctx: IContextAuthenticated) {
    return ctx.prisma.decryptionChallenge.update({
      where: { id: this.id },
      data: {
        approvedAt: new Date(),
        rejectedAt: null,
        blockIp: this.blockIp ? false : null // if it was previously rejected, we mark it as false
      }
    })
  }

  @Field(() => DecryptionChallengeGQL)
  async reject(@Ctx() ctx: IContextAuthenticated) {
    return ctx.prisma.decryptionChallenge.update({
      where: { id: this.id },
      data: { rejectedAt: new Date(), blockIp: true, approvedAt: null }
    })
  }

  @Field(() => DecryptionChallengeGQL)
  async recoverAccount(@Ctx() ctx: IContextAuthenticated) {
    // TODO send notification to all contacts we have, email for now
    return ctx.prisma.user.update({
      where: { id: this.userId },
      data: { recoveryDecryptionChallengeId: this.id } // rest is handled by our CRON job
    })
  }
}

import { createUnionType } from 'type-graphql'

const SearchResultUnion = createUnionType({
  name: 'ChallengeType', // the name of the GraphQL union
  types: () => [DecryptionChallengeMutation] as const // function that returns tuple of object types classes
})
