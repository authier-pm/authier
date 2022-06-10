-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" TEXT NOT NULL DEFAULT E'free-trial',
ADD COLUMN     "stripeId" TEXT;
