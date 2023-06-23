/*
  Warnings:

  - You are about to drop the column `deviceSyncTOTP` on the `DefaultSettings` table. All the data in the column will be lost.
  - You are about to drop the column `deviceTheme` on the `DefaultSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DefaultSettings" DROP COLUMN "deviceSyncTOTP",
DROP COLUMN "deviceTheme",
ADD COLUMN     "syncTOTP" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'dark';
