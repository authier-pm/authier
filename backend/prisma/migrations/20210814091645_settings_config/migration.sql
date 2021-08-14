/*
  Warnings:

  - A unique constraint covering the columns `[primaryDeviceId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `firstIpAdress` on the `Device` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lastIpAdress` on the `Device` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ipAdress` on the `OTPCodeEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `firebaseToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "firstIpAdress",
ADD COLUMN     "firstIpAdress" INET NOT NULL,
DROP COLUMN "lastIpAdress",
ADD COLUMN     "lastIpAdress" INET NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EncryptedAuths" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OTPCodeEvent" DROP COLUMN "ipAdress",
ADD COLUMN     "ipAdress" INET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firebaseToken" TEXT NOT NULL,
ADD COLUMN     "primaryDeviceId" INTEGER;

-- CreateTable
CREATE TABLE "SettingsConfig" (
    "id" SERIAL NOT NULL,
    "lockTime" INTEGER NOT NULL,
    "TwoFA" BOOLEAN NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultUnlockEvents" (
    "id" SERIAL NOT NULL,
    "deviceIp" INET NOT NULL,
    "approvedFromIp" INET,
    "approvedAt" TIMESTAMP(3),
    "deviceId" INTEGER NOT NULL,
    "approvedFromDeviceId" INTEGER,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_primaryDeviceId_unique" ON "User"("primaryDeviceId");

-- AddForeignKey
ALTER TABLE "VaultUnlockEvents" ADD FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultUnlockEvents" ADD FOREIGN KEY ("approvedFromDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("primaryDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
