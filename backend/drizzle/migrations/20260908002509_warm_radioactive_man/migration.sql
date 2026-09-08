CREATE TABLE "VaultChange" (
	"userId" uuid,
	"revision" bigint,
	"secretId" uuid NOT NULL,
	"encrypted" text NOT NULL,
	"kind" "EncryptedSecretType" NOT NULL,
	"version" integer NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3),
	"deletedAt" timestamp(3),
	CONSTRAINT "VaultChange_pkey" PRIMARY KEY("userId","revision")
);
--> statement-breakpoint
CREATE TABLE "VaultOperation" (
	"userId" uuid,
	"operationId" uuid,
	"requestHash" text NOT NULL,
	"response" jsonb,
	"createdAt" timestamp(3) DEFAULT now() NOT NULL,
	CONSTRAINT "VaultOperation_pkey" PRIMARY KEY("userId","operationId")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "vaultRevision" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "VaultChange" ADD CONSTRAINT "VaultChange_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "VaultOperation" ADD CONSTRAINT "VaultOperation_userId_User_id_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
--> statement-breakpoint
-- Keep legacy writers out until backfill is atomic.
LOCK TABLE "EncryptedSecret" IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
INSERT INTO "VaultChange" ("userId", revision, "secretId", encrypted, kind, version, "createdAt", "updatedAt", "deletedAt")
SELECT "userId", row_number() OVER (PARTITION BY "userId" ORDER BY "createdAt", id), id, encrypted, kind, version, "createdAt", "updatedAt", "deletedAt" FROM "EncryptedSecret";
--> statement-breakpoint
UPDATE "User" SET "vaultRevision" = revisions.revision FROM
(SELECT "userId", max(revision) AS revision FROM "VaultChange" GROUP BY "userId") revisions
WHERE "User".id = revisions."userId";
