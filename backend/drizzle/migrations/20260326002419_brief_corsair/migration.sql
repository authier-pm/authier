ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "confirmedAt" timestamp(3);--> statement-breakpoint
ALTER TABLE "MasterDeviceResetRequest" ADD COLUMN "confirmationToken" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "MasterDeviceResetRequest_confirmationToken_key" ON "MasterDeviceResetRequest" ("confirmationToken");