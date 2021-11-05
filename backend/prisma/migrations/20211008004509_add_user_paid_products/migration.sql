/*
  Warnings:

  - Added the required column `TOTPlimit` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loginCretentialsLimit` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "TOTPlimit" INTEGER NOT NULL,
ADD COLUMN     "loginCretentialsLimit" INTEGER NOT NULL;
SET CONSTRAINTS ALL DEFERRED;
UPDATE "User" SET "TOTPlimit" = 4, "loginCretentialsLimit" = 50;

-- CreateTable
CREATE TABLE "UserPaidProducts" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "productId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "checkoutSessionId" TEXT NOT NULL,

    CONSTRAINT "UserPaidProducts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPaidProducts_productId_key" ON "UserPaidProducts"("productId");

-- AddForeignKey
ALTER TABLE "UserPaidProducts" ADD CONSTRAINT "UserPaidProducts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "User_masterDeviceId_unique" RENAME TO "User_masterDeviceId_key";
