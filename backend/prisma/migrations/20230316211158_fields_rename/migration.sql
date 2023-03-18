/*
  Warnings:

  - You are about to drop the column `syncTOTP` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `autofill` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uiLocalisation` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "syncTOTP",
ADD COLUMN     "sync2FA" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "autofill",
DROP COLUMN "language",
DROP COLUMN "theme",
DROP COLUMN "uiLocalisation",
ADD COLUMN     "autofillCredentialsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autofillTOTPEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultDeviceTheme" TEXT NOT NULL DEFAULT 'dark',
ADD COLUMN     "uiLanguage" TEXT NOT NULL DEFAULT 'en';
