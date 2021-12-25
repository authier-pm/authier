import { GraphQLPositiveInt } from 'graphql-scalars'
import { Field, GraphQLISODateTime, Ctx, ObjectType, Arg } from 'type-graphql'
import { IContext, IContextAuthenticated } from '../schemas/RootResolver'
import { EncryptedSecretQuery } from './EncryptedSecret'
import { DeviceGQL, DeviceGQLScalars } from './generated/Device'
import { SecretUsageEventGQLScalars } from './generated/SecretUsageEvent'

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

  @Field(() => SecretUsageEventGQLScalars)
  async reportSecretUsageEvent(
    @Ctx() ctx: IContext,
    @Arg('kind') kind: string,
    @Arg('secretId', () => GraphQLPositiveInt) secretId: number,
    @Arg('webInputId', () => GraphQLPositiveInt) webInputId: number
  ) {
    const res = await ctx.prisma.secretUsageEvent.create({
      data: {
        ipAddress: ctx.getIpAddress(),
        kind,
        timestamp: new Date(),
        secretId,
        userId: this.userId,
        deviceId: this.id,
        webInputId
      }
    })
    return res
  }
}
