import * as TypeGraphQL from "type-graphql";

export enum OTPCodeEventScalarFieldEnum {
  id = "id",
  kind = "kind",
  timestamp = "timestamp",
  ipAddress = "ipAddress",
  url = "url",
  userId = "userId",
  webInputId = "webInputId"
}
TypeGraphQL.registerEnumType(OTPCodeEventScalarFieldEnum, {
  name: "OTPCodeEventScalarFieldEnum",
  description: undefined,
});
