-- Pre-existing rows hold the confirmation token in plaintext and have no
-- expiresAt. Both columns we are about to add are NOT NULL, and any
-- in-flight reset request from before this migration is also a security
-- liability under the new at-rest model. Drop them; affected users will
-- need to re-initiate their master-device reset.
DELETE FROM "MasterDeviceResetRequest";--> statement-breakpoint
DROP INDEX "MasterDeviceResetRequest_confirmationToken_key";--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "expiresAt" timestamp(3) NOT NULL;--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "confirmationTokenHash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" DROP COLUMN "confirmationToken";--> statement-breakpoint
CREATE UNIQUE INDEX "MasterDeviceResetRequest_confirmationTokenHash_key" ON "MasterDeviceResetRequest" ("confirmationTokenHash");--> statement-breakpoint
CREATE INDEX "MasterDeviceResetRequest_expiresAt_idx" ON "MasterDeviceResetRequest" ("expiresAt");