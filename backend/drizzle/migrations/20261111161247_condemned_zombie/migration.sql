ALTER TABLE "DecryptionChallenge" ADD COLUMN "emailApprovalTokenHash" text;--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD COLUMN "emailApprovalExpiresAt" timestamp(3);--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD COLUMN "emailApprovalSentAt" timestamp(3);--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD COLUMN "emailApprovedAt" timestamp(3);--> statement-breakpoint
ALTER TABLE "DecryptionChallenge" ADD COLUMN "deviceApprovedAt" timestamp(3);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "newDevicePolicy" SET DATA TYPE text;--> statement-breakpoint
-- Require an explicit new choice from accounts that previously disabled approval.
-- Unconfigured accounts use email approval until that choice is saved.
UPDATE "User" SET "newDevicePolicy" = CASE
  WHEN "newDevicePolicy" IN ('REQUIRE_ANY_DEVICE_APPROVAL', 'REQUIRE_MASTER_DEVICE_APPROVAL') THEN 'OTHER_DEVICE'
  ELSE NULL
END;--> statement-breakpoint
DROP TYPE "UserNewDevicePolicy";--> statement-breakpoint
CREATE TYPE "UserNewDevicePolicy" AS ENUM('EMAIL', 'OTHER_DEVICE', 'EMAIL_OR_OTHER_DEVICE', 'EMAIL_AND_OTHER_DEVICE');--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "newDevicePolicy" SET DATA TYPE "UserNewDevicePolicy" USING "newDevicePolicy"::"UserNewDevicePolicy";--> statement-breakpoint
UPDATE "DecryptionChallenge" SET "deviceApprovedAt" = "approvedAt"
WHERE "approvedFromDeviceId" IS NOT NULL;--> statement-breakpoint
-- A legacy automatic approval is not permission to enroll a new device.
UPDATE "DecryptionChallenge" AS challenge SET "approvedAt" = NULL
WHERE challenge."approvedAt" IS NOT NULL
  AND challenge."approvedFromDeviceId" IS NULL
  AND NOT challenge."approvedByRecovery"
  AND NOT EXISTS (
    SELECT 1 FROM "Device" AS device
    WHERE device.id = challenge."deviceId" AND device."userId" = challenge."userId"
  );
