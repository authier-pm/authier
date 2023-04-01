-- DropForeignKey
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_deviceId_fkey";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
