import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'

@ObjectType()
export class DefaultDeviceSettingsGQLScalars {
  @Field(() => Int)
  id: number

  @Field(() => GraphQLISODateTime)
  createdAt: Date

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null

  @Field(() => Boolean)
  autofillCredentialsEnabled: boolean

  @Field(() => Boolean)
  autofillTOTPEnabled: boolean

  @Field(() => String)
  theme: string

  @Field(() => Boolean)
  syncTOTP: boolean

  @Field(() => Int)
  vaultLockTimeoutSeconds: number

  @Field(() => String)
  userId: string
}

@ObjectType()
export class DefaultDeviceSettingsGQL extends DefaultDeviceSettingsGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
