/*
  Warnings:

  - You are about to drop the `SettingsConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SettingsConfig" DROP CONSTRAINT "SettingsConfig_userId_fkey";

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "syncTOTP" SET DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autofill" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT E'en',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT E'light';

-- DropTable
DROP TABLE "SettingsConfig";
