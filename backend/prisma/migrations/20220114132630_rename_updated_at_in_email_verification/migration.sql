/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `EmailVerification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailVerification" DROP COLUMN "updatedAt",
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
