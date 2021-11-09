import * as TypeGraphQL from 'type-graphql'
import * as GraphQLScalars from 'graphql-scalars'
import { Prisma } from '@prisma/client'
import { DecimalJSScalar } from '../scalars'
import { Device } from '../models/Device'
import { EncryptedSecret } from '../models/EncryptedSecret'
import { SecretUsageEvent } from '../models/SecretUsageEvent'
import { SettingsConfig } from '../models/SettingsConfig'
import { Tag } from '../models/Tag'
import { Token } from '../models/Token'
import { UserPaidProducts } from '../models/UserPaidProducts'
import { WebInput } from '../models/WebInput'

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class User {
  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  id!: string

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  email?: string | null

  @TypeGraphQL.Field((_type) => TypeGraphQL.Int, {
    nullable: false
  })
  tokenVersion!: number

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  username?: string | null

  addDeviceSecret?: string

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  addDeviceSecretEncrypted!: string

  Token?: Token[]

  @TypeGraphQL.Field((_type) => Date, {
    nullable: false
  })
  createdAt!: Date

  @TypeGraphQL.Field((_type) => Date, {
    nullable: true
  })
  updatedAt?: Date | null

  masterDevice?: Device | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  masterDeviceId?: string | null

  @TypeGraphQL.Field((_type) => TypeGraphQL.Int, {
    nullable: false
  })
  TOTPlimit!: number

  @TypeGraphQL.Field((_type) => TypeGraphQL.Int, {
    nullable: false
  })
  loginCredentialsLimit!: number

  UsageEvents?: SecretUsageEvent[]

  EncryptedSecrets?: EncryptedSecret[]

  Devices?: Device[]

  WebInputsAdded?: WebInput[]

  SettingsConfig?: SettingsConfig[]

  Tags?: Tag[]

  UserPaidProducts?: UserPaidProducts[]
}
