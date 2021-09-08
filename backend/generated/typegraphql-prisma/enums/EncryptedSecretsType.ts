import * as TypeGraphQL from "type-graphql";

export enum EncryptedSecretsType {
  TOTP = "TOTP",
  LOGIN_CREDENTIALS = "LOGIN_CREDENTIALS"
}
TypeGraphQL.registerEnumType(EncryptedSecretsType, {
  name: "EncryptedSecretsType",
  description: undefined,
});
