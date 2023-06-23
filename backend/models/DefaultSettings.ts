import { Arg, Ctx, Field, ObjectType } from 'type-graphql'
import { DefaultDeviceSettingsGQLScalars } from './generated/DefaultDeviceSettingsGQL'

import { IContextAuthenticated } from '../schemas/RootResolver'
import { DefaultSettingsInput } from './models'

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

    if (this.id) {
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
