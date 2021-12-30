-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL', 'API');

-- CreateEnum
CREATE TYPE "EncryptedSecretType" AS ENUM ('TOTP', 'LOGIN_CREDENTIALS');

-- CreateEnum
CREATE TYPE "WebInputType" AS ENUM ('TOTP', 'USERNAME', 'EMAIL', 'USERNAME_OR_EMAIL', 'PASSWORD');

-- CreateTable
CREATE TABLE "EncryptedSecret" (
    "id" SERIAL NOT NULL,
    "encrypted" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "EncryptedSecretType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "url" TEXT NOT NULL,
    "lastUsageEventId" BIGINT,
    "iconUrl" TEXT,
    "label" TEXT NOT NULL,

    CONSTRAINT "EncryptedSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "firstIpAddress" INET NOT NULL,
    "lastIpAddress" INET NOT NULL,
    "firebaseToken" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "syncTOTP" BOOLEAN NOT NULL DEFAULT true,
    "ipAddressLock" BOOLEAN NOT NULL DEFAULT false,
    "vaultLockTimeoutSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "registeredWithMasterAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "masterPasswordOutdatedAt" TIMESTAMP(3),
    "userId" UUID NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsConfig" (
    "userId" UUID NOT NULL,
    "lockTime" INTEGER NOT NULL,
    "twoFA" BOOLEAN NOT NULL,
    "noHandsLogin" BOOLEAN NOT NULL,
    "homeUI" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "SettingsConfig_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "SecretUsageEvent" (
    "id" BIGSERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" INET NOT NULL,
    "url" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "webInputId" INTEGER,

    CONSTRAINT "SecretUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultUnlockEvents" (
    "id" SERIAL NOT NULL,
    "deviceIp" INET NOT NULL,
    "approvedFromIp" INET,
    "approvedAt" TIMESTAMP(3),
    "deviceId" UUID NOT NULL,
    "approvedFromDeviceId" UUID,

    CONSTRAINT "VaultUnlockEvents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebInput" (
    "id" SERIAL NOT NULL,
    "layoutType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "kind" "WebInputType" NOT NULL,
    "domPath" TEXT NOT NULL,
    "addedByUserId" UUID NOT NULL,

    CONSTRAINT "WebInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "username" TEXT,
    "addDeviceSecret" TEXT NOT NULL,
    "addDeviceSecretEncrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "masterDeviceId" UUID,
    "TOTPlimit" INTEGER NOT NULL,
    "loginCredentialsLimit" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "type" "TokenType" NOT NULL,
    "emailToken" TEXT,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "expiration" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPaidProducts" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "checkoutSessionId" TEXT NOT NULL,

    CONSTRAINT "UserPaidProducts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Device_updatedAt_idx" ON "Device"("updatedAt");

-- CreateIndex
CREATE INDEX "Device_lastSyncAt_idx" ON "Device"("lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettingsConfig_userId_key" ON "SettingsConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebInput_url_domPath_key" ON "WebInput"("url", "domPath");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_masterDeviceId_key" ON "User"("masterDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_emailToken_key" ON "Token"("emailToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserPaidProducts_productId_key" ON "UserPaidProducts"("productId");

-- AddForeignKey
ALTER TABLE "EncryptedSecret" ADD CONSTRAINT "EncryptedSecret_lastUsageEventId_fkey" FOREIGN KEY ("lastUsageEventId") REFERENCES "SecretUsageEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedSecret" ADD CONSTRAINT "EncryptedSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsConfig" ADD CONSTRAINT "SettingsConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_webInputId_fkey" FOREIGN KEY ("webInputId") REFERENCES "WebInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultUnlockEvents" ADD CONSTRAINT "VaultUnlockEvents_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaultUnlockEvents" ADD CONSTRAINT "VaultUnlockEvents_approvedFromDeviceId_fkey" FOREIGN KEY ("approvedFromDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebInput" ADD CONSTRAINT "WebInput_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_masterDeviceId_fkey" FOREIGN KEY ("masterDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaidProducts" ADD CONSTRAINT "UserPaidProducts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
