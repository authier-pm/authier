-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL', 'API');

-- CreateEnum
CREATE TYPE "EncryptedSecretsType" AS ENUM ('TOTP', 'LOGIN_CREDENTIALS');

-- CreateEnum
CREATE TYPE "WebInputType" AS ENUM ('TOTP', 'USERNAME', 'EMAIL', 'USERNAME_OR_EMAIL', 'PASSWORD');

-- CreateTable
CREATE TABLE "EncryptedSecretsChangeAction" (
    "id" SERIAL NOT NULL,
    "encrypted" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "EncryptedSecretsType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "fromDeviceId" UUID NOT NULL,

    CONSTRAINT "EncryptedSecretsChangeAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EncryptedSecrets" (
    "id" SERIAL NOT NULL,
    "encrypted" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "EncryptedSecretsType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "EncryptedSecrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "firstIpAddress" INET NOT NULL,
    "lastIpAddress" INET NOT NULL,
    "firebaseToken" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "syncTOTP" BOOLEAN NOT NULL DEFAULT true,
    "vaultLockTimeoutSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "registeredWithMasterAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
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
CREATE TABLE "OTPCodeEvent" (
    "id" BIGSERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" INET NOT NULL,
    "url" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "webInputId" INTEGER,

    CONSTRAINT "OTPCodeEvent_pkey" PRIMARY KEY ("id")
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
    "passwordHash" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "username" TEXT,
    "loginSecret" UUID,
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
CREATE UNIQUE INDEX "EncryptedSecretsChangeAction_userId_key" ON "EncryptedSecretsChangeAction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedSecrets_userId_kind_key" ON "EncryptedSecrets"("userId", "kind");

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
CREATE UNIQUE INDEX "User_loginSecret_key" ON "User"("loginSecret");

-- CreateIndex
CREATE UNIQUE INDEX "User_masterDeviceId_key" ON "User"("masterDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_emailToken_key" ON "Token"("emailToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserPaidProducts_productId_key" ON "UserPaidProducts"("productId");

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
ALTER TABLE "OTPCodeEvent" ADD CONSTRAINT "OTPCodeEvent_webInputId_fkey" FOREIGN KEY ("webInputId") REFERENCES "WebInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
