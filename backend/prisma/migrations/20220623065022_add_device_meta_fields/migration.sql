-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "lastLockAt" TIMESTAMP(3),
ADD COLUMN     "lastUnlockAt" TIMESTAMP(3);
