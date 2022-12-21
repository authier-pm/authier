/*
  Warnings:

  - The primary key for the `EmailVerification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emailAddressVerifiedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `address` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kind` to the `EmailVerification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmailVerificationType" AS ENUM ('PRIMARY', 'CONTACT');

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "deauthorizedFromDeviceId" UUID;

-- AlterTable
ALTER TABLE "EmailVerification" DROP CONSTRAINT "EmailVerification_pkey",
ADD COLUMN     "address" CITEXT NOT NULL,
ADD COLUMN     "kind" "EmailVerificationType" NOT NULL,
ADD CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("address");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailAddressVerifiedAt";
