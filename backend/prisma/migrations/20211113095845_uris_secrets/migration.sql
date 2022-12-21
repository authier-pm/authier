-- AlterTable
ALTER TABLE "EncryptedSecret" ADD COLUMN     "androidUri" TEXT,
ADD COLUMN     "iosUri" TEXT,
ALTER COLUMN "url" DROP NOT NULL;
