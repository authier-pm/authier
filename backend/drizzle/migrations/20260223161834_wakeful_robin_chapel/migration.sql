CREATE TABLE "MasterDeviceResetRequest" (
	"id" serial PRIMARY KEY,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"processAt" timestamp(3) NOT NULL,
	"completedAt" timestamp(3),
	"rejectedAt" timestamp(3),
	"targetMasterDeviceId" text NOT NULL,
	"decryptionChallengeId" integer NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" RENAME CONSTRAINT "DecryptionChallenge_userId_fkey" TO "DecryptionChallenge_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" RENAME CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_fkey" TO "DecryptionChallenge_approvedFromDeviceId_Device_id_fkey";--> statement-breakpoint
ALTER TABLE "DefaultSettings" RENAME CONSTRAINT "DefaultSettings_userId_fkey" TO "DefaultSettings_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "Device" RENAME CONSTRAINT "Device_userId_fkey" TO "Device_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "EmailVerification" RENAME CONSTRAINT "EmailVerification_userId_fkey" TO "EmailVerification_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "EncryptedSecret" RENAME CONSTRAINT "EncryptedSecret_userId_fkey" TO "EncryptedSecret_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "MasterDeviceChange" RENAME CONSTRAINT "MasterDeviceChange_userId_fkey" TO "MasterDeviceChange_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" RENAME CONSTRAINT "SecretUsageEvent_userId_fkey" TO "SecretUsageEvent_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" RENAME CONSTRAINT "SecretUsageEvent_deviceId_fkey" TO "SecretUsageEvent_deviceId_Device_id_fkey";--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" RENAME CONSTRAINT "SecretUsageEvent_webInputId_fkey" TO "SecretUsageEvent_webInputId_WebInput_id_fkey";--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" RENAME CONSTRAINT "SecretUsageEvent_secretId_fkey" TO "SecretUsageEvent_secretId_EncryptedSecret_id_fkey";--> statement-breakpoint
ALTER TABLE "Tag" RENAME CONSTRAINT "Tag_userId_fkey" TO "Tag_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "Token" RENAME CONSTRAINT "Token_userId_fkey" TO "Token_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "User" RENAME CONSTRAINT "User_masterDeviceId_fkey" TO "User_masterDeviceId_Device_id_fkey";--> statement-breakpoint
ALTER TABLE "User" RENAME CONSTRAINT "User_recoveryDecryptionChallengeId_fkey" TO "User_recoveryDecryptionChallengeId_DecryptionChallenge_id_fkey";--> statement-breakpoint
ALTER TABLE "UserPaidProducts" RENAME CONSTRAINT "UserPaidProducts_userId_fkey" TO "UserPaidProducts_userId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "WebInput" RENAME CONSTRAINT "WebInput_addedByUserId_fkey" TO "WebInput_addedByUserId_User_id_fkey";--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD COLUMN "pushNotificationsSentCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD COLUMN "pushNotificationsFailedCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "MasterDeviceResetRequest_decryptionChallengeId_key" ON "MasterDeviceResetRequest" ("decryptionChallengeId");--> statement-breakpoint
CREATE INDEX "MasterDeviceResetRequest_userId_idx" ON "MasterDeviceResetRequest" ("userId");--> statement-breakpoint
CREATE INDEX "MasterDeviceResetRequest_processAt_idx" ON "MasterDeviceResetRequest" ("processAt");--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD CONSTRAINT "MasterDeviceResetRequest_HvFB3D6sZNJH_fkey" FOREIGN KEY ("decryptionChallengeId") REFERENCES "DecryptionChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD CONSTRAINT "MasterDeviceResetRequest_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "EncryptedSecret" DROP CONSTRAINT "EncryptedSecret_userId_User_id_fkey", ADD CONSTRAINT "EncryptedSecret_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Device" DROP CONSTRAINT "Device_userId_User_id_fkey", ADD CONSTRAINT "Device_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_deviceId_Device_id_fkey", ADD CONSTRAINT "SecretUsageEvent_deviceId_Device_id_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_secretId_EncryptedSecret_id_fkey", ADD CONSTRAINT "SecretUsageEvent_secretId_EncryptedSecret_id_fkey" FOREIGN KEY ("secretId") REFERENCES "EncryptedSecret"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_userId_User_id_fkey", ADD CONSTRAINT "SecretUsageEvent_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "SecretUsageEvent" DROP CONSTRAINT "SecretUsageEvent_webInputId_WebInput_id_fkey", ADD CONSTRAINT "SecretUsageEvent_webInputId_WebInput_id_fkey" FOREIGN KEY ("webInputId") REFERENCES "WebInput"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "WebInput" DROP CONSTRAINT "WebInput_addedByUserId_User_id_fkey", ADD CONSTRAINT "WebInput_addedByUserId_User_id_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "User" DROP CONSTRAINT "User_masterDeviceId_Device_id_fkey", ADD CONSTRAINT "User_masterDeviceId_Device_id_fkey" FOREIGN KEY ("masterDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "User" DROP CONSTRAINT "User_recoveryDecryptionChallengeId_DecryptionChallenge_id_fkey", ADD CONSTRAINT "User_recoveryDecryptionChallengeId_DecryptionChallenge_id_fkey" FOREIGN KEY ("recoveryDecryptionChallengeId") REFERENCES "DecryptionChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_User_id_fkey", ADD CONSTRAINT "Token_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "UserPaidProducts" DROP CONSTRAINT "UserPaidProducts_userId_User_id_fkey", ADD CONSTRAINT "UserPaidProducts_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_User_id_fkey", ADD CONSTRAINT "Tag_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" DROP CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_Device_id_fkey", ADD CONSTRAINT "DecryptionChallenge_approvedFromDeviceId_Device_id_fkey" FOREIGN KEY ("approvedFromDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" DROP CONSTRAINT "DecryptionChallenge_userId_User_id_fkey", ADD CONSTRAINT "DecryptionChallenge_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "EmailVerification" DROP CONSTRAINT "EmailVerification_userId_User_id_fkey", ADD CONSTRAINT "EmailVerification_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MasterDeviceChange" DROP CONSTRAINT "MasterDeviceChange_userId_User_id_fkey", ADD CONSTRAINT "MasterDeviceChange_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "DefaultSettings" DROP CONSTRAINT "DefaultSettings_userId_User_id_fkey", ADD CONSTRAINT "DefaultSettings_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;