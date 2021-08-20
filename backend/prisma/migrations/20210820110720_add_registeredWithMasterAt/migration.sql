/*
  Warnings:

  - The values [API] on the enum `EncryptedSecretsType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EncryptedSecretsType_new" AS ENUM ('TOTP', 'LOGIN_CREDENTIALS');
ALTER TABLE "EncryptedSecretsChangeAction" ALTER COLUMN "kind" TYPE "EncryptedSecretsType_new" USING ("kind"::text::"EncryptedSecretsType_new");
ALTER TABLE "EncryptedSecrets" ALTER COLUMN "kind" TYPE "EncryptedSecretsType_new" USING ("kind"::text::"EncryptedSecretsType_new");
ALTER TYPE "EncryptedSecretsType" RENAME TO "EncryptedSecretsType_old";
ALTER TYPE "EncryptedSecretsType_new" RENAME TO "EncryptedSecretsType";
DROP TYPE "EncryptedSecretsType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "registeredWithMasterAt" TIMESTAMP(3);
