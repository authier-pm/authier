import { Field, GraphQLISODateTime, Ctx, ObjectType } from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/Device'

@ObjectType()
export class DeviceQuery extends DeviceGQL {
  @Field(() => [EncryptedSecretQuery])
  async encryptedSecretsToSync(@Ctx() ctx: IContextAuthenticated) {
    const lastSyncCondition = { gte: this.lastSyncAt ?? undefined }
    const { userId } = ctx.jwtPayload
    const res = await ctx.prisma.encryptedSecret.findMany({
      where: {
        OR: [
          {
            userId: userId,
            createdAt: lastSyncCondition
          },
          {
            userId: userId,
            updatedAt: lastSyncCondition
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
