import { Field, GraphQLISODateTime, Ctx, ObjectType } from 'type-graphql'
import { IContext } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/Device'

@ObjectType()
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

@ObjectType()
export class DeviceMutation extends DeviceGQLScalars {
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
