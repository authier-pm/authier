import * as TypeGraphQL from 'type-graphql'
import * as GraphQLScalars from 'graphql-scalars'
import { Prisma } from '@prisma/client'
import { DecimalJSScalar } from '../scalars'
import { Device } from '../models/Device'
import { User } from '../models/User'
import { EncryptedSecretsType } from '../enums/EncryptedSecretsType'

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class EncryptedSecretsChangeAction {
  @TypeGraphQL.Field((_type) => TypeGraphQL.Int, {
    nullable: false
  })
  id!: number

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  encrypted!: string

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  userId!: string

  @TypeGraphQL.Field((_type) => EncryptedSecretsType, {
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
  processedAt?: Date | null

  @TypeGraphQL.Field((_type) => String, {
    nullable: false
  })
  fromDeviceId!: string

  fromDevice?: Device

  user?: User
}
