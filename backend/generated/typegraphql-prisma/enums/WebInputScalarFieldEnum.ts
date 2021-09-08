import * as TypeGraphQL from "type-graphql";

export enum WebInputScalarFieldEnum {
  id = "id",
  layoutType = "layoutType",
  createdAt = "createdAt",
  url = "url",
  kind = "kind",
  domPath = "domPath",
  addedByUserId = "addedByUserId"
}
TypeGraphQL.registerEnumType(WebInputScalarFieldEnum, {
  name: "WebInputScalarFieldEnum",
  description: undefined,
});
