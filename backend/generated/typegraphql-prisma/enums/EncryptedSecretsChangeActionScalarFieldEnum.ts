import * as TypeGraphQL from "type-graphql";

export enum EncryptedSecretsChangeActionScalarFieldEnum {
  id = "id",
  encrypted = "encrypted",
  userId = "userId",
  kind = "kind",
  createdAt = "createdAt",
  processedAt = "processedAt",
  fromDeviceId = "fromDeviceId"
}
TypeGraphQL.registerEnumType(EncryptedSecretsChangeActionScalarFieldEnum, {
  name: "EncryptedSecretsChangeActionScalarFieldEnum",
  description: undefined,
});
