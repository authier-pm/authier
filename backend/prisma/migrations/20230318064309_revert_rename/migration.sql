/*
  Warnings:

  - You are about to drop the column `sync2FA` on the `Device` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "sync2FA",
ADD COLUMN     "syncTOTP" BOOLEAN NOT NULL DEFAULT false;
