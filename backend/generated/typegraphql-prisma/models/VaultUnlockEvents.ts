import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../scalars";
import { Device } from "../models/Device";

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class VaultUnlockEvents {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  id!: number;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  deviceIp!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: true
  })
  approvedFromIp?: string | null;

  @TypeGraphQL.Field(_type => Date, {
    nullable: true
  })
  approvedAt?: Date | null;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  deviceId!: number;

  device?: Device;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  approvedFromDeviceId?: number | null;

  approvedFromDevice?: Device | null;
}
