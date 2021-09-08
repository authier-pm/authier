import * as TypeGraphQL from "type-graphql";

export enum SettingsConfigScalarFieldEnum {
  id = "id",
  lockTime = "lockTime",
  TwoFA = "TwoFA"
}
TypeGraphQL.registerEnumType(SettingsConfigScalarFieldEnum, {
  name: "SettingsConfigScalarFieldEnum",
  description: undefined,
});
