ALTER TABLE "User" ADD COLUMN "autofillForbiddenUrlPatterns" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "DefaultSettings" DROP COLUMN "autofillCredentialsEnabled";--> statement-breakpoint
ALTER TABLE "Device" DROP COLUMN "autofillCredentialsEnabled";