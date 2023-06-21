import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'

@ObjectType()
export class DefaultSettingsGQLScalars {
  @Field(() => Int)
  id: number

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field()
  autofillCredentialsEnabled: boolean

  @Field()
  autofillTOTPEnabled: boolean

  @Field()
  uiLanguage: string

  @Field()
  deviceTheme: string

  @Field()
  deviceSyncTOTP: boolean

  @Field(() => Int)
  vaultLockTimeoutSeconds: number

  @Field()
  userId: string
}

@ObjectType()
export class DefaultSettingsGQL extends DefaultSettingsGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
