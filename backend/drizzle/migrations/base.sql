CREATE EXTENSION IF NOT EXISTS citext
--> statement-breakpoint
CREATE TYPE "EmailVerificationType" AS ENUM('PRIMARY', 'CONTACT');
--> statement-breakpoint
CREATE TYPE "EncryptedSecretType" AS ENUM('TOTP', 'LOGIN_CREDENTIALS');
--> statement-breakpoint
CREATE TYPE "TokenType" AS ENUM('EMAIL', 'API');
--> statement-breakpoint
CREATE TYPE "UserNewDevicePolicy" AS ENUM('ALLOW', 'REQUIRE_ANY_DEVICE_APPROVAL', 'REQUIRE_MASTER_DEVICE_APPROVAL');
--> statement-breakpoint
CREATE TYPE "WebInputType" AS ENUM('TOTP', 'USERNAME', 'EMAIL', 'USERNAME_OR_EMAIL', 'PASSWORD', 'NEW_PASSWORD', 'NEW_PASSWORD_CONFIRMATION', 'SUBMIT_BUTTON', 'CUSTOM');
--> statement-breakpoint
CREATE TABLE "DecryptionChallenge" (
	"id" serial PRIMARY KEY,
	"ipAddress" inet NOT NULL,
	"approvedAt" timestamp(3),
	"userId" uuid NOT NULL,
	"deviceId" text NOT NULL,
	"approvedFromDeviceId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"masterPasswordVerifiedAt" timestamp(3),
	"blockIp" boolean,
	"rejectedAt" timestamp(3),
	"approvedByRecovery" boolean DEFAULT false NOT NULL,
	"deviceName" text NOT NULL,
	"pushNotificationsSentCount" integer DEFAULT 0 NOT NULL,
	"pushNotificationsFailedCount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DefaultSettings" (
	"id" serial PRIMARY KEY,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"autofillCredentialsEnabled" boolean DEFAULT true NOT NULL,
	"autofillTOTPEnabled" boolean DEFAULT true NOT NULL,
	"vaultLockTimeoutSeconds" integer DEFAULT 86400 NOT NULL,
	"userId" uuid NOT NULL,
	"syncTOTP" boolean DEFAULT true NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Device" (
	"id" text PRIMARY KEY,
	"firstIpAddress" inet NOT NULL,
	"lastIpAddress" inet NOT NULL,
	"firebaseToken" text,
	"name" text NOT NULL,
	"ipAddressLock" boolean DEFAULT false NOT NULL,
	"vaultLockTimeoutSeconds" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"registeredWithMasterAt" timestamp(3),
	"lastSyncAt" timestamp(3),
	"masterPasswordOutdatedAt" timestamp(3),
	"userId" uuid NOT NULL,
	"logoutAt" timestamp(3),
	"platform" text NOT NULL,
	"lastLockAt" timestamp(3),
	"lastUnlockAt" timestamp(3),
	"syncTOTP" boolean NOT NULL,
	"deletedAt" timestamp(3),
	"autofillCredentialsEnabled" boolean NOT NULL,
	"autofillTOTPEnabled" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EmailVerification" (
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"userId" uuid NOT NULL,
	"token" uuid NOT NULL,
	"address" citext PRIMARY KEY,
	"kind" "EmailVerificationType" NOT NULL,
	"verifiedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "EncryptedSecret" (
	"encrypted" text NOT NULL,
	"version" integer NOT NULL,
	"userId" uuid NOT NULL,
	"kind" "EncryptedSecretType" NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"id" uuid PRIMARY KEY,
	"deletedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "MasterDeviceChange" (
	"id" text PRIMARY KEY,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"processAt" timestamp(3) NOT NULL,
	"oldDeviceId" text NOT NULL,
	"newDeviceId" text NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MasterDeviceResetRequest" (
	"id" serial PRIMARY KEY,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"processAt" timestamp(3) NOT NULL,
	"confirmedAt" timestamp(3),
	"completedAt" timestamp(3),
	"rejectedAt" timestamp(3),
	"confirmationToken" text NOT NULL,
	"targetMasterDeviceId" text NOT NULL,
	"decryptionChallengeId" integer NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SecretUsageEvent" (
	"id" bigserial PRIMARY KEY,
	"kind" text NOT NULL,
	"timestamp" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ipAddress" inet NOT NULL,
	"url" text,
	"userId" uuid NOT NULL,
	"deviceId" text NOT NULL,
	"webInputId" integer,
	"secretId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Tag" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Token" (
	"id" serial PRIMARY KEY,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"type" "TokenType" NOT NULL,
	"emailToken" text,
	"valid" boolean DEFAULT true NOT NULL,
	"expiration" timestamp(3) NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY,
	"email" citext,
	"tokenVersion" integer DEFAULT 0 NOT NULL,
	"username" text,
	"addDeviceSecret" text NOT NULL,
	"addDeviceSecretEncrypted" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"masterDeviceId" text,
	"TOTPlimit" integer NOT NULL,
	"loginCredentialsLimit" integer NOT NULL,
	"encryptionSalt" text NOT NULL,
	"deviceRecoveryCooldownMinutes" integer NOT NULL,
	"recoveryDecryptionChallengeId" integer,
	"notificationOnVaultUnlock" boolean DEFAULT false NOT NULL,
	"notificationOnWrongPasswordAttempts" integer DEFAULT 3 NOT NULL,
	"uiLanguage" text DEFAULT 'en' NOT NULL,
	"newDevicePolicy" "UserNewDevicePolicy"
);
--> statement-breakpoint
CREATE TABLE "UserPaidProducts" (
	"id" serial PRIMARY KEY,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"expiresAt" timestamp(3),
	"productId" text NOT NULL,
	"userId" uuid NOT NULL,
	"checkoutSessionId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "WebInput" (
	"id" serial PRIMARY KEY,
	"layoutType" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"url" varchar(2048) NOT NULL,
	"kind" "WebInputType" NOT NULL,
	"domPath" text NOT NULL,
	"addedByUserId" uuid,
	"host" varchar(253) NOT NULL,
	"domOrdinal" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD CONSTRAINT "DecryptionChallenge_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_Device_id_fkey" FOREIGN KEY ("approvedFromDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "DefaultSettings" ADD CONSTRAINT "DefaultSettings_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "EncryptedSecret" ADD CONSTRAINT "EncryptedSecret_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "MasterDeviceChange" ADD CONSTRAINT "MasterDeviceChange_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD CONSTRAINT "MasterDeviceResetRequest_HvFB3D6sZNJH_fkey" FOREIGN KEY ("decryptionChallengeId") REFERENCES "DecryptionChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD CONSTRAINT "MasterDeviceResetRequest_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_deviceId_Device_id_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_webInputId_WebInput_id_fkey" FOREIGN KEY ("webInputId") REFERENCES "WebInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" ADD CONSTRAINT "SecretUsageEvent_secretId_EncryptedSecret_id_fkey" FOREIGN KEY ("secretId") REFERENCES "EncryptedSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "Token" ADD CONSTRAINT "Token_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_masterDeviceId_Device_id_fkey" FOREIGN KEY ("masterDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_recoveryDecryptionChallengeId_DecryptionChallenge_id_fkey" FOREIGN KEY ("recoveryDecryptionChallengeId") REFERENCES "DecryptionChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "UserPaidProducts" ADD CONSTRAINT "UserPaidProducts_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
--> statement-breakpoint
ALTER TABLE "WebInput" ADD CONSTRAINT "WebInput_addedByUserId_User_id_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
--> statement-breakpoint
CREATE UNIQUE INDEX "DefaultSettings_userId_key" ON "DefaultSettings" ("userId");
--> statement-breakpoint
CREATE UNIQUE INDEX "Device_firebaseToken_key" ON "Device" ("firebaseToken");
--> statement-breakpoint
CREATE UNIQUE INDEX "Device_userId_id_key" ON "Device" ("userId","id");
--> statement-breakpoint
CREATE UNIQUE INDEX "EmailVerification_token_key" ON "EmailVerification" ("token");
--> statement-breakpoint
CREATE UNIQUE INDEX "MasterDeviceResetRequest_decryptionChallengeId_key" ON "MasterDeviceResetRequest" ("decryptionChallengeId");
--> statement-breakpoint
CREATE UNIQUE INDEX "MasterDeviceResetRequest_confirmationToken_key" ON "MasterDeviceResetRequest" ("confirmationToken");
--> statement-breakpoint
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag" ("userId","name");
--> statement-breakpoint
CREATE UNIQUE INDEX "Token_emailToken_key" ON "Token" ("emailToken");
--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX "User_masterDeviceId_key" ON "User" ("masterDeviceId");
--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_key" ON "User" ("username");
--> statement-breakpoint
CREATE UNIQUE INDEX "WebInput_url_domPath_key" ON "WebInput" ("url","domPath");
--> statement-breakpoint
CREATE INDEX "DecryptionChallenge_deviceId_idx" ON "DecryptionChallenge" ("deviceId");
--> statement-breakpoint
CREATE INDEX "DecryptionChallenge_userId_idx" ON "DecryptionChallenge" ("userId");
--> statement-breakpoint
CREATE INDEX "Device_lastSyncAt_idx" ON "Device" ("lastSyncAt");
--> statement-breakpoint
CREATE INDEX "Device_updatedAt_idx" ON "Device" ("updatedAt");
--> statement-breakpoint
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification" ("userId");
--> statement-breakpoint
CREATE INDEX "EncryptedSecret_userId_idx" ON "EncryptedSecret" ("userId");
--> statement-breakpoint
CREATE INDEX "MasterDeviceResetRequest_userId_idx" ON "MasterDeviceResetRequest" ("userId");
--> statement-breakpoint
CREATE INDEX "MasterDeviceResetRequest_processAt_idx" ON "MasterDeviceResetRequest" ("processAt");
--> statement-breakpoint
CREATE INDEX "SecretUsageEvent_secretId_idx" ON "SecretUsageEvent" ("secretId");
--> statement-breakpoint
CREATE INDEX "Token_userId_idx" ON "Token" ("userId");
--> statement-breakpoint
CREATE INDEX "UserPaidProducts_userId_idx" ON "UserPaidProducts" ("userId");
--> statement-breakpoint
CREATE INDEX "WebInput_host_idx" ON "WebInput" ("host");
--> statement-breakpoint
CREATE INDEX "WebInput_kind_idx" ON "WebInput" ("kind");