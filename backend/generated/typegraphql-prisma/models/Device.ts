import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../scalars";
import { EncryptedSecretsChangeAction } from "../models/EncryptedSecretsChangeAction";
import { User } from "../models/User";
import { VaultUnlockEvents } from "../models/VaultUnlockEvents";

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class Device {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  id!: number;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  firstIpAddress!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  lastIpAddress!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  firebaseToken!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  name!: string;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  vaultLockTimeoutSeconds?: number | null;

  @TypeGraphQL.Field(_type => Date, {
    nullable: false
  })
  createdAt!: Date;

  @TypeGraphQL.Field(_type => Date, {
    nullable: true
  })
  updatedAt?: Date | null;

  @TypeGraphQL.Field(_type => Date, {
    nullable: true
  })
  registeredWithMasterAt?: Date | null;

  VaultUnlockEvents?: VaultUnlockEvents[];

  VaultUnlockEventsApproved?: VaultUnlockEvents[];

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  userId!: string;

  User?: User;

  UserMaster?: User | null;

  EncryptedChanges?: EncryptedSecretsChangeAction[];
}
