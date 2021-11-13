import * as TypeGraphQL from 'type-graphql'
import * as GraphQLScalars from 'graphql-scalars'
import { Prisma } from '@prisma/client'
import { DecimalJSScalar } from '../scalars'
import { SecretUsageEvent } from '../models/SecretUsageEvent'
import { User } from '../models/User'
import { EncryptedSecretType } from '../enums/EncryptedSecretType'

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class EncryptedSecret {
  @TypeGraphQL.Field((_type) => TypeGraphQL.Int, {
    nullable: false
  })
  id!: number

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  encrypted!: string

  @TypeGraphQL.Field((_type) => TypeGraphQL.Int, {
    nullable: false
  })
  version!: number

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  userId!: string

  @TypeGraphQL.Field((_type) => EncryptedSecretType, {
    nullable: false
  })
  kind!: 'TOTP' | 'LOGIN_CREDENTIALS'

  @TypeGraphQL.Field((_type) => Date, {
    nullable: false
  })
  createdAt!: Date

  @TypeGraphQL.Field((_type) => Date, {
    nullable: true
  })
  updatedAt?: Date | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  url?: string | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  androidUri?: string | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  iosUri?: string | null

  @TypeGraphQL.Field((_type) => GraphQLScalars.BigIntResolver, {
    nullable: true
  })
  lastUsageEventId?: bigint | null

  lastUsageEvent?: SecretUsageEvent | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: true
  })
  iconUrl?: string | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  label!: string

  user?: User
}
