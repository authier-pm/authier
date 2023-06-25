/*
  Warnings:

  - You are about to drop the column `uiLanguage` on the `DefaultSettings` table. All the data in the column will be lost.
  - You are about to drop the column `uiLanguage` on the `Device` table. All the data in the column will be lost.
  - Made the column `vaultLockTimeoutSeconds` on table `Device` required. This step will fail if there are existing NULL values in that column.
  - Made the column `syncTOTP` on table `Device` required. This step will fail if there are existing NULL values in that column.
  - Made the column `autofillCredentialsEnabled` on table `Device` required. This step will fail if there are existing NULL values in that column.
  - Made the column `autofillTOTPEnabled` on table `Device` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DefaultSettings" DROP COLUMN "uiLanguage";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "uiLanguage",
ALTER COLUMN "vaultLockTimeoutSeconds" SET NOT NULL,
ALTER COLUMN "syncTOTP" SET NOT NULL,
ALTER COLUMN "autofillCredentialsEnabled" SET NOT NULL,
ALTER COLUMN "autofillTOTPEnabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "uiLanguage" TEXT NOT NULL DEFAULT 'en';
