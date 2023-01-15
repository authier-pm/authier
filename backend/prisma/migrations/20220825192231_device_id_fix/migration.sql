/*
  Warnings:

  - The primary key for the `Device` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "DecryptionChallenge" DROP CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_fkey";

-- DropForeignKey
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_masterDeviceId_fkey";

-- AlterTable
ALTER TABLE "DecryptionChallenge" ALTER COLUMN "deviceId" SET DATA TYPE TEXT,
ALTER COLUMN "approvedFromDeviceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Device" DROP CONSTRAINT "Device_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Device_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SecretUsageEvent" ALTER COLUMN "deviceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "masterDeviceId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "DecryptionChallenge" ADD CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_fkey" FOREIGN KEY ("approvedFromDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_masterDeviceId_fkey" FOREIGN KEY ("masterDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
