/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "DecryptionChallenge_userId_idx" ON "DecryptionChallenge"("userId");

-- CreateIndex
CREATE INDEX "DecryptionChallenge_deviceId_idx" ON "DecryptionChallenge"("deviceId");

-- CreateIndex
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");

-- CreateIndex
CREATE INDEX "EncryptedSecret_userId_idx" ON "EncryptedSecret"("userId");

-- CreateIndex
CREATE INDEX "SecretUsageEvent_secretId_idx" ON "SecretUsageEvent"("secretId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "Token_userId_idx" ON "Token"("userId");

-- CreateIndex
CREATE INDEX "UserPaidProducts_userId_idx" ON "UserPaidProducts"("userId");
