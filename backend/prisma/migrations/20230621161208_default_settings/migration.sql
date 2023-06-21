/*
  Warnings:

  - You are about to drop the column `autofillCredentialsEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `autofillTOTPEnabled` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `defaultDeviceSyncTOTP` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `defaultDeviceTheme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `uiLanguage` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "autofillCredentialsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autofillTOTPEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "uiLanguage" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "autofillCredentialsEnabled",
DROP COLUMN "autofillTOTPEnabled",
DROP COLUMN "defaultDeviceSyncTOTP",
DROP COLUMN "defaultDeviceTheme",
DROP COLUMN "uiLanguage";

-- CreateTable
CREATE TABLE "DefaultSettings" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "autofillCredentialsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autofillTOTPEnabled" BOOLEAN NOT NULL DEFAULT true,
    "uiLanguage" TEXT NOT NULL DEFAULT 'en',
    "deviceTheme" TEXT NOT NULL DEFAULT 'dark',
    "deviceSyncTOTP" BOOLEAN NOT NULL DEFAULT true,
    "vaultLockTimeoutSeconds" INTEGER NOT NULL DEFAULT 28800,
    "userId" UUID NOT NULL,

    CONSTRAINT "DefaultSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultSettings_userId_key" ON "DefaultSettings"("userId");

-- AddForeignKey
ALTER TABLE "DefaultSettings" ADD CONSTRAINT "DefaultSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
