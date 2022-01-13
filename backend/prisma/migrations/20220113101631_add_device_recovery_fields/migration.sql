/*
  Warnings:

  - Added the required column `deviceRecoveryCooldownMinutes` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DecryptionChallenge" ADD COLUMN     "approvedByRecovery" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deviceRecoveryCooldownMinutes" INTEGER NOT NULL,
ADD COLUMN     "recoveryDecryptionChallengeId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_recoveryDecryptionChallengeId_fkey" FOREIGN KEY ("recoveryDecryptionChallengeId") REFERENCES "DecryptionChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
