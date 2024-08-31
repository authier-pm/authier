import { Arg, Ctx, Field, Int, ObjectType } from 'type-graphql'
import { DefaultDeviceSettingsGQLScalars } from './generated/DefaultDeviceSettingsGQL'

import type { IContextAuthenticated } from '../schemas/RootResolver'
import { DefaultSettingsInput } from './models'

@ObjectType()
export class DefaultDeviceSettingsQuery extends DefaultDeviceSettingsGQLScalars {
  @Field(() => Int, {
    nullable: false,
    description: '0 index for system defaults'
  })
  declare id: number
}

@ObjectType()
export class DefaultDeviceSettingsMutation extends DefaultDeviceSettingsGQLScalars {
  @Field(() => DefaultDeviceSettingsGQLScalars)
  async update(
    @Arg('config', () => DefaultSettingsInput) config: DefaultSettingsInput,
    @Ctx() ctx: IContextAuthenticated
  ) {
    const data = {
      autofillTOTPEnabled: config.autofillTOTPEnabled,
      syncTOTP: config.syncTOTP,
      vaultLockTimeoutSeconds: config.vaultLockTimeoutSeconds,
      autofillCredentialsEnabled: config.autofillCredentialsEnabled,
      theme: config.theme
    }

    if (this.id && this.id !== 0) {
      return await ctx.prisma.defaultDeviceSettings.update({
        where: {
          id: this.id
        },

        data
      })
    }

    return await ctx.prisma.defaultDeviceSettings.create({
      data: {
        ...data,
        user: {
          connect: {
            id: ctx.jwtPayload.userId
          }
        }
      }
    })
  }
}
