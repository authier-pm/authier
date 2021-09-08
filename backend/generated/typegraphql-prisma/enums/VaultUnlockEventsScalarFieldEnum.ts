import * as TypeGraphQL from "type-graphql";

export enum VaultUnlockEventsScalarFieldEnum {
  id = "id",
  deviceIp = "deviceIp",
  approvedFromIp = "approvedFromIp",
  approvedAt = "approvedAt",
  deviceId = "deviceId",
  approvedFromDeviceId = "approvedFromDeviceId"
}
TypeGraphQL.registerEnumType(VaultUnlockEventsScalarFieldEnum, {
  name: "VaultUnlockEventsScalarFieldEnum",
  description: undefined,
});
