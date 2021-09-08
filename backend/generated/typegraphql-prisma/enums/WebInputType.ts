import * as TypeGraphQL from "type-graphql";

export enum WebInputType {
  TOTP = "TOTP",
  USERNAME = "USERNAME",
  EMAIL = "EMAIL",
  USERNAME_OR_EMAIL = "USERNAME_OR_EMAIL",
  PASSWORD = "PASSWORD"
}
TypeGraphQL.registerEnumType(WebInputType, {
  name: "WebInputType",
  description: undefined,
});
