/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "firstIpAdress" SET DATA TYPE TEXT,
ALTER COLUMN "lastIpAdress" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "EncryptedAuths" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "OTPCodeEvent" ALTER COLUMN "url" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "ipAdress" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Token" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WebOTPInput" ALTER COLUMN "url" SET DATA TYPE TEXT,
ALTER COLUMN "createdByUserId" SET DATA TYPE TEXT;
