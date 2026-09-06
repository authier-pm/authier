ALTER TABLE "User" RENAME COLUMN "addDeviceSecret" TO "addDeviceSecretHash";
--> statement-breakpoint
UPDATE "User" SET "addDeviceSecretHash" = encode(sha256(convert_to("addDeviceSecretHash", 'UTF8')), 'hex');
