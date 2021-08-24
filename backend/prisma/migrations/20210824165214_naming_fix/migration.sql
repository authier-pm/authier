/*
  Warnings:

  - You are about to drop the column `ipAdress` on the `OTPCodeEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,kind]` on the table `EncryptedSecrets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ipAddress` to the `OTPCodeEvent` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EncryptedSecrets.userId_unique";

-- AlterTable
ALTER TABLE "OTPCodeEvent" DROP COLUMN "ipAdress",
ADD COLUMN     "ipAddress" INET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedSecrets.userId_kind_unique" ON "EncryptedSecrets"("userId", "kind");
