-- CreateEnum
CREATE TYPE "UserNewDevicePolicy" AS ENUM ('ALLOW', 'REQUIRE_ANY_DEVICE_APPROVAL', 'REQUIRE_MASTER_DEVICE_APPROVAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "newDevicePolicy" "UserNewDevicePolicy";
