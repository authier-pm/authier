/*
  Warnings:

  - You are about to drop the column `deauthorizedFromDeviceId` on the `Device` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "deauthorizedFromDeviceId";
