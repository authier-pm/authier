import * as TypeGraphQL from "type-graphql";

export enum UserScalarFieldEnum {
  id = "id",
  email = "email",
  passwordHash = "passwordHash",
  tokenVersion = "tokenVersion",
  name = "name",
  createdAt = "createdAt",
  updatedAt = "updatedAt",
  masterDeviceId = "masterDeviceId",
  TOTPlimit = "TOTPlimit",
  loginCredentialsLimit = "loginCredentialsLimit"
}
TypeGraphQL.registerEnumType(UserScalarFieldEnum, {
  name: "UserScalarFieldEnum",
  description: undefined,
});
