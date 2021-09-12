import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../scalars";
import { User } from "../models/User";

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class SettingsConfig {
  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  userId!: string;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  lockTime!: number;

  @TypeGraphQL.Field(_type => Boolean, {
    nullable: false
  })
  twoFA!: boolean;

  @TypeGraphQL.Field(_type => Boolean, {
    nullable: false
  })
  noHandsLogin!: boolean;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  homeUI!: string;

  @TypeGraphQL.Field(_type => Date, {
    nullable: false
  })
  updatedAt!: Date;

  user?: User;
}
