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
      autofillTOTPEnabled: config.autofillTOTPEnabled ?? true,
      uiLanguage: config.uiLanguage ?? 'en',
      deviceSyncTOTP: config.syncTOTP ?? true,
      vaultLockTimeoutSeconds: config.vaultLockTimeoutSeconds ?? 28800,
      autofillCredentialsEnabled: config.autofillCredentialsEnabled ?? true,
      deviceTheme: config.theme ?? 'dark'
    }

    return await ctx.prisma.defaultDeviceSettings.update({
      where: {
        id: this.id
      },

      data
    })
  }
}
