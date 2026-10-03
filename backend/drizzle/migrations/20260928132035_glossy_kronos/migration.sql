CREATE TABLE "RelayedVerificationCode" (
	"userId" uuid,
	"id" uuid,
	"deviceId" text NOT NULL,
	"encrypted" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	CONSTRAINT "RelayedVerificationCode_pkey" PRIMARY KEY("userId","id")
);
--> statement-breakpoint
CREATE INDEX "RelayedVerificationCode_expiresAt_idx" ON "RelayedVerificationCode" ("expiresAt");--> statement-breakpoint
ALTER TABLE "RelayedVerificationCode" ADD CONSTRAINT "RelayedVerificationCode_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "RelayedVerificationCode" ADD CONSTRAINT "RelayedVerificationCode_deviceId_Device_id_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;