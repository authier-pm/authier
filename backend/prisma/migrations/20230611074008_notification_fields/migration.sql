-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationOnVaultUnlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationOnWrongPasswordAttempts" INTEGER NOT NULL DEFAULT 3;
