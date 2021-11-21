import { Field, GraphQLISODateTime, Ctx } from 'type-graphql'
import { IContext } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL } from './generated/Device'

export class DeviceQuery extends DeviceGQL {
  @Field(() => [EncryptedSecretQuery])
  async encryptedSecretsToSync(@Ctx() ctx: IContext) {
    const res = await ctx.prisma.encryptedSecret.findMany({
      where: {
        OR: [
          {
            userId: this.id,
            createdAt: { gte: this.lastSyncAt }
          },
          {
            userId: this.id,
            updatedAt: { gte: this.lastSyncAt }
          }
        ]
      }
    })
    return res
  }
}
export class DeviceMutation extends DeviceGQL {
  @Field(() => GraphQLISODateTime)
  async markAsSynced(@Ctx() ctx: IContext) {
    const res = await ctx.prisma.device.update({
      data: {
        lastSyncAt: new Date()
      },
      where: {
        id: this.id
      }
    })
    return res
  }
}
