import * as TypeGraphQL from "type-graphql";

export enum EncryptedSecretsScalarFieldEnum {
  id = "id",
  encrypted = "encrypted",
  version = "version",
  userId = "userId",
  kind = "kind",
  createdAt = "createdAt",
  updatedAt = "updatedAt"
}
TypeGraphQL.registerEnumType(EncryptedSecretsScalarFieldEnum, {
  name: "EncryptedSecretsScalarFieldEnum",
  description: undefined,
});
