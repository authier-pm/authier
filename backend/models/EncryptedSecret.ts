import { Arg, Ctx, Field, ObjectType } from 'type-graphql'
import { IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretGQL } from './generated/EncryptedSecret'
import { EncryptedSecretInput } from './models'

@ObjectType()
export class EncryptedSecretQuery extends EncryptedSecretGQL {}

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
