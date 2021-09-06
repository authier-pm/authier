/*
  Warnings:

  - You are about to drop the column `account_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `User` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User.account_name_unique";

-- DropIndex
DROP INDEX "User.phone_number_unique";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "account_name",
DROP COLUMN "phone_number";

ALTER TABLE "User" RENAME COLUMN "password" TO "passwordHash";
