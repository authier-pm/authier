/*
  Warnings:

  - You are about to drop the column `lastUsageEventId` on the `EncryptedSecret` table. All the data in the column will be lost.
  - Added the required column `secretId` to the `SecretUsageEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EncryptedSecret" DROP CONSTRAINT "EncryptedSecret_lastUsageEventId_fkey";

-- AlterTable
ALTER TABLE "EncryptedSecret" DROP COLUMN "lastUsageEventId";

-- AlterTable
ALTER TABLE "SecretUsageEvent" ADD COLUMN     "secretId" INTEGER NOT NULL,
ALTER COLUMN "url" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "EncryptedSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
