CREATE TABLE "MasterDeviceResetEmail" (
	"id" serial PRIMARY KEY,
	"userId" uuid NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"sentAt" timestamp(3)
);
--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "config" jsonb DEFAULT '{"requiredApprovals":1,"waitMinutes":2880,"notificationEmails":[]}' NOT NULL;--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "eligibleDeviceIds" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "approvedDeviceIds" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "masterDeviceResetConfig" jsonb DEFAULT '{"requiredApprovals":1,"waitMinutes":2880,"notificationEmails":[]}' NOT NULL;--> statement-breakpoint
ALTER TABLE "MasterDeviceResetEmail" ADD CONSTRAINT "MasterDeviceResetEmail_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
-- Preserve existing users' email-only recovery policy; new signups get one approval / 48h.
UPDATE "User" SET "masterDeviceResetConfig" = jsonb_build_object(
  'requiredApprovals', 0, 'waitMinutes', LEAST(129600, GREATEST(5, "deviceRecoveryCooldownMinutes")), 'notificationEmails', '[]'::jsonb
), "deviceRecoveryCooldownMinutes" = LEAST(129600, GREATEST(5, "deviceRecoveryCooldownMinutes"));
--> statement-breakpoint
UPDATE "MasterDeviceResetRequest" r SET "config" = u."masterDeviceResetConfig"
FROM "User" u WHERE u.id = r."userId";
