import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../scalars";
import { Device } from "../models/Device";
import { EncryptedSecrets } from "../models/EncryptedSecrets";
import { EncryptedSecretsChangeAction } from "../models/EncryptedSecretsChangeAction";
import { OTPCodeEvent } from "../models/OTPCodeEvent";
import { Token } from "../models/Token";
import { WebInput } from "../models/WebInput";

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class User {
  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  id!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: true
  })
  email?: string | null;

  passwordHash?: string;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  tokenVersion!: number;

  @TypeGraphQL.Field(_type => String, {
    nullable: true
  })
  name?: string | null;

  EncryptedSecrets?: EncryptedSecrets[];

  Token?: Token[];

  @TypeGraphQL.Field(_type => Date, {
    nullable: false
  })
  createdAt!: Date;

  @TypeGraphQL.Field(_type => Date, {
    nullable: false
  })
  updatedAt!: Date;

  masterDevice?: Device | null;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  masterDeviceId?: number | null;

  OTPCodeEvents?: OTPCodeEvent[];

  Devices?: Device[];

  WebInputsAdded?: WebInput[];

  EncryptedChanges?: EncryptedSecretsChangeAction[];
}
