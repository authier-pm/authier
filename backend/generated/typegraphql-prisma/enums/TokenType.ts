import * as TypeGraphQL from "type-graphql";

export enum TokenType {
  EMAIL = "EMAIL",
  API = "API"
}
TypeGraphQL.registerEnumType(TokenType, {
  name: "TokenType",
  description: undefined,
});
