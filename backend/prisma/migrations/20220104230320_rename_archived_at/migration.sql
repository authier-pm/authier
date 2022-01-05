/*
  Warnings:

  - You are about to drop the column `archivedAt` on the `EncryptedSecret` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EncryptedSecret" DROP COLUMN "archivedAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
