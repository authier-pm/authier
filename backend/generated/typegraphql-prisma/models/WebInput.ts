import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../scalars";
import { OTPCodeEvent } from "../models/OTPCodeEvent";
import { User } from "../models/User";
import { WebInputType } from "../enums/WebInputType";

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class WebInput {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  id!: number;

  @TypeGraphQL.Field(_type => String, {
    nullable: true
  })
  layoutType?: string | null;

  @TypeGraphQL.Field(_type => Date, {
    nullable: false
  })
  createdAt!: Date;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  url!: string;

  @TypeGraphQL.Field(_type => WebInputType, {
    nullable: false
  })
  kind!: "TOTP" | "USERNAME" | "EMAIL" | "USERNAME_OR_EMAIL" | "PASSWORD";

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  domPath!: string;

  addedByUser?: User;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  addedByUserId!: string;

  OTPCodeEvent?: OTPCodeEvent[];
}
