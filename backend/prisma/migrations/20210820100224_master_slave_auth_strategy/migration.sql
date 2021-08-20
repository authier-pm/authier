/*
  Warnings:

  - You are about to drop the column `firstIpAdress` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `lastIpAdress` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `webOTPInputId` on the `OTPCodeEvent` table. All the data in the column will be lost.
  - You are about to drop the column `primaryDeviceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `EncryptedAuths` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebOTPInput` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[masterDeviceId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstIpAddress` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastIpAddress` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EncryptedSecretsType" AS ENUM ('TOTP', 'API');

-- CreateEnum
CREATE TYPE "WebInputType" AS ENUM ('TOTP', 'USERNAME', 'EMAIL', 'USERNAME_OR_EMAIL', 'PASSWORD');

-- DropForeignKey
ALTER TABLE "EncryptedAuths" DROP CONSTRAINT "EncryptedAuths_userId_fkey";

-- DropForeignKey
ALTER TABLE "OTPCodeEvent" DROP CONSTRAINT "OTPCodeEvent_webOTPInputId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_primaryDeviceId_fkey";

-- DropForeignKey
ALTER TABLE "WebOTPInput" DROP CONSTRAINT "WebOTPInput_createdByUserId_fkey";

-- DropIndex
DROP INDEX "User_primaryDeviceId_unique";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "firstIpAdress",
DROP COLUMN "lastIpAdress",
ADD COLUMN     "firstIpAddress" INET NOT NULL,
ADD COLUMN     "lastIpAddress" INET NOT NULL;

-- AlterTable
ALTER TABLE "OTPCodeEvent" DROP COLUMN "webOTPInputId",
ADD COLUMN     "webInputId" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "primaryDeviceId",
ADD COLUMN     "masterDeviceId" INTEGER;

-- DropTable
DROP TABLE "EncryptedAuths";

-- DropTable
DROP TABLE "WebOTPInput";

-- CreateTable
CREATE TABLE "EncryptedSecretsChangeAction" (
    "id" SERIAL NOT NULL,
    "encrypted" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "EncryptedSecretsType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "fromDeviceId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncryptedSecrets" (
    "id" SERIAL NOT NULL,
    "encrypted" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "EncryptedSecretsType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebInput" (
    "id" SERIAL NOT NULL,
    "layoutType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "kind" "WebInputType" NOT NULL,
    "domPath" TEXT NOT NULL,
    "addedByUserId" UUID NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedSecretsChangeAction.userId_unique" ON "EncryptedSecretsChangeAction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedSecrets.userId_unique" ON "EncryptedSecrets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_masterDeviceId_unique" ON "User"("masterDeviceId");

-- AddForeignKey
ALTER TABLE "EncryptedSecretsChangeAction" ADD FOREIGN KEY ("fromDeviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedSecretsChangeAction" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedSecrets" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTPCodeEvent" ADD FOREIGN KEY ("webInputId") REFERENCES "WebInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebInput" ADD FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("masterDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
