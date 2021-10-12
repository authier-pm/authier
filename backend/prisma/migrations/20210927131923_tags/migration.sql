-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_fkey";

-- DropForeignKey
ALTER TABLE "EncryptedSecrets" DROP CONSTRAINT "EncryptedSecrets_userId_fkey";

-- DropForeignKey
ALTER TABLE "EncryptedSecretsChangeAction" DROP CONSTRAINT "EncryptedSecretsChangeAction_fromDeviceId_fkey";

-- DropForeignKey
ALTER TABLE "EncryptedSecretsChangeAction" DROP CONSTRAINT "EncryptedSecretsChangeAction_userId_fkey";

-- DropForeignKey
ALTER TABLE "OTPCodeEvent" DROP CONSTRAINT "OTPCodeEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "SettingsConfig" DROP CONSTRAINT "SettingsConfig_userId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- DropForeignKey
ALTER TABLE "VaultUnlockEvents" DROP CONSTRAINT "VaultUnlockEvents_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "WebInput" DROP CONSTRAINT "WebInput_addedByUserId_fkey";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "syncTOTP" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EncryptedSecretsChangeAction" ADD CONSTRAINT "EncryptedSecretsChangeAction_fromDeviceId_fkey" FOREIGN KEY ("fromDeviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedSecretsChangeAction" ADD CONSTRAINT "EncryptedSecretsChangeAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedSecrets" ADD CONSTRAINT "EncryptedSecrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsConfig" ADD CONSTRAINT "SettingsConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTPCodeEvent" ADD CONSTRAINT "OTPCodeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultUnlockEvents" ADD CONSTRAINT "VaultUnlockEvents_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebInput" ADD CONSTRAINT "WebInput_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "EncryptedSecrets.userId_kind_unique" RENAME TO "EncryptedSecrets_userId_kind_key";

-- RenameIndex
ALTER INDEX "EncryptedSecretsChangeAction.userId_unique" RENAME TO "EncryptedSecretsChangeAction_userId_key";

-- RenameIndex
ALTER INDEX "SettingsConfig.userId_unique" RENAME TO "SettingsConfig_userId_key";

-- RenameIndex
ALTER INDEX "Token.emailToken_unique" RENAME TO "Token_emailToken_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";
