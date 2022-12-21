/*
  Warnings:

  - You are about to drop the `VaultUnlockEvents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VaultUnlockEvents" DROP CONSTRAINT "VaultUnlockEvents_approvedFromDeviceId_fkey";

-- DropForeignKey
ALTER TABLE "VaultUnlockEvents" DROP CONSTRAINT "VaultUnlockEvents_deviceId_fkey";

-- DropTable
DROP TABLE "VaultUnlockEvents";

-- CreateTable
CREATE TABLE "DecryptionChallenge" (
    "id" SERIAL NOT NULL,
    "ipAddress" INET NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "userId" UUID NOT NULL,
    "deviceId" UUID,
    "approvedFromDeviceId" UUID,

    CONSTRAINT "DecryptionChallenge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DecryptionChallenge" ADD CONSTRAINT "DecryptionChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecryptionChallenge" ADD CONSTRAINT "DecryptionChallenge_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecryptionChallenge" ADD CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_fkey" FOREIGN KEY ("approvedFromDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
