import { Arg, Ctx, Field, ObjectType } from 'type-graphql'
import { IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretGQL } from './generated/EncryptedSecretGQL'
import { EncryptedSecretInput } from './models'

@ObjectType()
export class EncryptedSecretQuery extends EncryptedSecretGQL {
  @Field(() => Date, { nullable: true })
  async lastUsedAt(@Ctx() ctx: IContextAuthenticated) {
    const lastUsed = await ctx.prisma.secretUsageEvent.findFirst({
      where: {
        secretId: this.id
      },
      orderBy: {
        timestamp: 'desc'
      },
      select: {
        timestamp: true
      }
    })
    return lastUsed?.timestamp
  }
}

@ObjectType()
export class EncryptedSecretMutation extends EncryptedSecretQuery {
  @Field(() => EncryptedSecretGQL)
  update(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('patch', () => EncryptedSecretInput) patch: EncryptedSecretInput
  ) {
    return ctx.prisma.encryptedSecret.update({
      where: { id: this.id },
      data: { ...patch, version: this.version + 1 }
    })
  }

  @Field(() => EncryptedSecretGQL)
  delete(@Ctx() ctx: IContextAuthenticated) {
    return ctx.prisma.encryptedSecret.update({
      where: { id: this.id },
      data: { deletedAt: new Date() }
    })
  }
}
