ALTER TABLE "Device" ADD COLUMN "resumeSecretHash" text;--> statement-breakpoint
ALTER TABLE "Device" ADD COLUMN "resumeTokenVersion" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "Device" SET "resumeTokenVersion" = "User"."tokenVersion" FROM "User" WHERE "Device"."userId" = "User"."id";
