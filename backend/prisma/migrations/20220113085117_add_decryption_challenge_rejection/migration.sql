-- AlterTable
ALTER TABLE "DecryptionChallenge" ADD COLUMN     "blockIp" BOOLEAN,
ADD COLUMN     "rejectedAt" TIMESTAMP(3);
