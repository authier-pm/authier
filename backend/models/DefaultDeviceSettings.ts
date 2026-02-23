import { Arg, Ctx, Field, Int, ObjectType } from 'type-graphql'
import { DefaultDeviceSettingsGQLScalars } from './generated/DefaultDeviceSettingsGQL'

import type { IContextAuthenticated } from './types/ContextTypes'
import { DefaultSettingsInput } from './models'
import { defaultSettings } from '../drizzle/schema'
import { eq } from 'drizzle-orm'

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
      const res = await ctx.db
        .update(defaultSettings)
        .set(data)
        .where(eq(defaultSettings.id, this.id))
        .returning()
      return res[0]
    }

    const res = await ctx.db
      .insert(defaultSettings)
      .values({
        ...data,
        userId: ctx.jwtPayload.userId
      })
      .returning()
    return res[0]
  }
}
