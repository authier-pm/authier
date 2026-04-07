import { Arg, Ctx, Field, ObjectType } from 'type-graphql'
import type { IContextAuthenticated } from './types/ContextTypes'
import { EncryptedSecretGQL } from './generated/EncryptedSecretGQL'
import { EncryptedSecretInput } from './models'
import { WebInputGQLScalars } from './generated/WebInputGQL'
import { secretUsageEvent, encryptedSecret } from '../drizzle/schema'
import { eq, desc, sql } from 'drizzle-orm'

@ObjectType()
export class EncryptedSecretQuery extends EncryptedSecretGQL {
  @Field(() => Date, { nullable: true })
  async lastUsedAt(@Ctx() ctx: IContextAuthenticated) {
    const lastUsed = await ctx.db.query.secretUsageEvent.findFirst({
      where: { secretId: this.id },
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
    console.log('update', this.id)

    const res = await ctx.db
      .update(encryptedSecret)
      .set({
        ...patch,
        version: this.version + 1,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(encryptedSecret.id, this.id))
      .returning()

    return res[0]
  }

  @Field(() => EncryptedSecretGQL)
  async delete(@Ctx() ctx: IContextAuthenticated) {
    console.log('delete', this.id)

    const res = await ctx.db
      .update(encryptedSecret)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(encryptedSecret.id, this.id))
      .returning()

    return res[0]
  }
}
