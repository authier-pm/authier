/*
  Warnings:

  - The primary key for the `EncryptedSecret` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `EncryptedSecret` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `secretId` on the `SecretUsageEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_secretId_fkey";

-- AlterTable
ALTER TABLE "EncryptedSecret" DROP CONSTRAINT "EncryptedSecret_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "EncryptedSecret_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SecretUsageEvent" DROP COLUMN "secretId",
ADD COLUMN     "secretId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "EncryptedSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Device.lastSyncAt_index" RENAME TO "Device_lastSyncAt_idx";

-- RenameIndex
ALTER INDEX "Device.updatedAt_index" RENAME TO "Device_updatedAt_idx";

-- RenameIndex
ALTER INDEX "SettingsConfig.userId_unique" RENAME TO "SettingsConfig_userId_key";

-- RenameIndex
ALTER INDEX "Token.emailToken_unique" RENAME TO "Token_emailToken_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";

-- RenameIndex
ALTER INDEX "User.masterDeviceId_unique" RENAME TO "User_masterDeviceId_key";

-- RenameIndex
ALTER INDEX "User.username_unique" RENAME TO "User_username_key";

-- RenameIndex
ALTER INDEX "UserPaidProducts.productId_unique" RENAME TO "UserPaidProducts_productId_key";

-- RenameIndex
ALTER INDEX "webInputIdentifier" RENAME TO "WebInput_url_domPath_key";
