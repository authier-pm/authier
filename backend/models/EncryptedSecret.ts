import { runVaultTransaction } from '../vault/vaultWrites'
import { Arg, Ctx, Field, ObjectType } from 'type-graphql'
import type { IContextAuthenticated } from './types/ContextTypes'
import { EncryptedSecretGQL } from './generated/EncryptedSecretGQL'
import { EncryptedSecretInput } from './models'

@ObjectType()
export class EncryptedSecretQuery extends EncryptedSecretGQL {
  @Field(() => Date, { nullable: true })
  async lastUsedAt(@Ctx() ctx: IContextAuthenticated) {
    const lastUsed = await ctx.db.query.secretUsageEvent.findFirst({
      where: { secretId: this.id, userId: ctx.jwtPayload.userId },
      orderBy: (s, { desc }) => [desc(s.timestamp)],
      columns: {
        timestamp: true
      }
    })

    return lastUsed?.timestamp
  }
}

@ObjectType()
export class EncryptedSecretMutation extends EncryptedSecretQuery {
  @Field(() => EncryptedSecretGQL)
  async update(
    @Ctx() ctx: IContextAuthenticated,
    @Arg('patch', () => EncryptedSecretInput) patch: EncryptedSecretInput
  ) {
    const [updated] = await runVaultTransaction(
      ctx.db,
      ctx.jwtPayload,
      (writer) => writer.update([this.id], patch)
    )
    if (!updated) throw new Error('Secret not found')
    return updated
  }

  @Field(() => EncryptedSecretGQL)
  async delete(@Ctx() ctx: IContextAuthenticated) {
    const [deleted] = await runVaultTransaction(
      ctx.db,
      ctx.jwtPayload,
      (writer) => writer.update([this.id], { deletedAt: new Date() })
    )
    if (!deleted) throw new Error('Secret not found')
    return deleted
  }
}
