import * as TypeGraphQL from "type-graphql";

export enum SettingsConfigScalarFieldEnum {
  userId = "userId",
  lockTime = "lockTime",
  twoFA = "twoFA",
  noHandsLogin = "noHandsLogin",
  homeUI = "homeUI",
  updatedAt = "updatedAt"
}
TypeGraphQL.registerEnumType(SettingsConfigScalarFieldEnum, {
  name: "SettingsConfigScalarFieldEnum",
  description: undefined,
});
