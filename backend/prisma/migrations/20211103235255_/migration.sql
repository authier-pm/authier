/*
  Warnings:

  - You are about to drop the column `loginSecret` on the `Device` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[loginSecret]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Device_loginSecret_key";

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "loginSecret";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loginSecret" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "User_loginSecret_key" ON "User"("loginSecret");
