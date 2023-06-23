import { Field, ObjectType, Int, GraphQLISODateTime } from 'type-graphql'
import { UserGQL } from './UserGQL'

@ObjectType()
export class DefaultDeviceSettingsGQLScalars {
  @Field(() => Int, { nullable: true })
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
  theme: string

  @Field()
  syncTOTP: boolean

  @Field(() => Int)
  vaultLockTimeoutSeconds: number

  @Field()
  userId: string
}

@ObjectType()
export class DefaultDeviceSettingsGQL extends DefaultDeviceSettingsGQLScalars {
  @Field(() => UserGQL)
  user: UserGQL

  // skip overwrite 👇
}
