/*
  Warnings:

  - Added the required column `deviceName` to the `DecryptionChallenge` table without a default value. This is not possible if the table is not empty.
  - Made the column `deviceId` on table `DecryptionChallenge` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DecryptionChallenge" ADD COLUMN     "deviceName" TEXT NOT NULL,
ALTER COLUMN "deviceId" SET NOT NULL;
