-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "logoutAt" TIMESTAMP(3);

-- AlterIndex
ALTER INDEX "Device_lastSyncAt_idx" RENAME TO "Device.lastSyncAt_index";

-- AlterIndex
ALTER INDEX "Device_updatedAt_idx" RENAME TO "Device.updatedAt_index";

-- AlterIndex
ALTER INDEX "SettingsConfig_userId_key" RENAME TO "SettingsConfig.userId_unique";

-- AlterIndex
ALTER INDEX "Token_emailToken_key" RENAME TO "Token.emailToken_unique";

-- AlterIndex
ALTER INDEX "User_email_key" RENAME TO "User.email_unique";

-- AlterIndex
ALTER INDEX "User_masterDeviceId_key" RENAME TO "User.masterDeviceId_unique";

-- AlterIndex
ALTER INDEX "User_username_key" RENAME TO "User.username_unique";

-- AlterIndex
ALTER INDEX "UserPaidProducts_productId_key" RENAME TO "UserPaidProducts.productId_unique";

-- AlterIndex
ALTER INDEX "WebInput_url_domPath_key" RENAME TO "webInputIdentifier";
